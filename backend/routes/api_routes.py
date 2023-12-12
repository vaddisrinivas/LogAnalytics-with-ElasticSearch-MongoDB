# Import the required modules
import base64
import gzip
import urllib.parse
import json
from time import sleep
from flask import jsonify, request, Blueprint
from flask_restx import Api, Resource, fields
from elasticsearch import Elasticsearch, exceptions
import os
import configparser

# Create a blueprint for the API routes
blueprint = Blueprint('api_routes', __name__, url_prefix="/api/v1/")
api = Api(
    blueprint,
    version="1.0",
    title="REST API for Log Ingestion and Search System")
ns = api.namespace("logs", description="Log operations")

# Read the configuration file based on the environment variable
config_file = f"config_{os.getenv('env', default='dev')}.cfg"
config = configparser.ConfigParser()
config.read(config_file)
es = None
while es is None:
    try:
        # Initialize Elasticsearch instance
        es = Elasticsearch(
            [{'host': config.get("es", "host"), 'port': config.get("es", "port")}])
    except Exception as e:
        print(e)
        print("Waiting for Elasticsearch to connect...")
        sleep(5)

# Define the index name
index_name = config.get("es", "index")

# Define mappings for the index
mapping = {
    "mappings": {
        "properties": {
            "level": {"type": "keyword"},
            "message": {"type": "text"},
            "resourceId": {"type": "keyword"},
            "timestamp": {"type": "date"},
            "traceId": {"type": "keyword"},
            "spanId": {"type": "keyword"},
            "commit": {"type": "keyword"},
            "metadata": {
                "properties": {
                    "parentResourceId": {"type": "keyword"}
                }
            }
        }
    }
}

# Create the index with the defined mappings
try:
    es.indices.create(index=index_name, body=mapping)
    print(f"Index '{index_name}' created successfully.")
except Exception as e:
    print(f"Failed to create index '{index_name}': {e}")

# Define a function to get all unique values for a field


def validate_json(data):
    if not isinstance(data, dict):
        return False

    expected_keys = [
        "level", "message", "resourceId", "timestamp",
        "traceId", "spanId", "commit", "metadata"
    ]

    if not all(key in data for key in expected_keys):
        return False

    # Validate specific data types and formats
    # if not isinstance(data["level"], str):
    #     return False

    # if not isinstance(data["message"], str):
    #     return False

    # if not isinstance(data["resourceId"], str):
    #     return False

    # try:
    #     # Check if the timestamp is in ISO 8601 format
    #     datetime.strptime(data["timestamp"], "%Y-%m-%dT%H:%M:%SZ")
    # except ValueError:
    #     return False

    # if not isinstance(data["traceId"], str):
    #     return False

    # if not isinstance(data["spanId"], str):
    #     return False

    # if not isinstance(data["commit"], str):
    #     return False

    # Validate metadata if present
    # if "metadata" in data:
    #     if not isinstance(data["metadata"], dict):
    #         return False

    #     if "parentResourceId" not in data["metadata"]:
    #         return False

    #     if not isinstance(data["metadata"]["parentResourceId"], str):
    #         return False

    return True

# Define a function to convert the compressed data to json
def convert(data):
    unquoted_data = urllib.parse.unquote(data)
    compressed_data = base64.b64decode(unquoted_data)
    text_data = gzip.decompress(compressed_data).decode('utf-8')
    final_data = urllib.parse.unquote(text_data)
    res = json.loads(final_data)
    if isinstance(res, str):
        return json.loads(res)
    return res


# Define a model for the log data
log_model = api.model("Log", {
    "level": fields.String(required=True, description="The log level"),
    "message": fields.String(required=True, description="The log message"),
    "resourceId": fields.String(required=True, description="The resource id"),
    "timestamp": fields.DateTime(required=True, description="The log timestamp"),
    "traceId": fields.String(required=True, description="The trace id"),
    "spanId": fields.String(required=True, description="The span id"),
    "commit": fields.String(required=True, description="The commit id"),
    "metadata": fields.Nested(api.model("Metadata", {
        "parentResourceId": fields.String(required=False, description="The parent resource id")
    }), required=False, description="The log metadata")
})

# Define a resource class for the logs endpoint


@ns.route("/")
class LogsAPI(Resource):

    # Define a method to handle log ingestion
    @api.expect(log_model, validate=True)
    @api.response(200, "Data pushed to Elasticsearch successfully")
    @api.response(500, "Failed to push data to Elasticsearch")
    def post(self):
        data = request.get_json()
        # print(data, type(data))
        try:
            if not validate_json(data):
                raise ValueError("Invalid JSON data")
            res = es.index(index=index_name, body=data)
            # print(res)
            return jsonify(
                {"message": "Data pushed to Elasticsearch successfully", "response": res})
        except ValueError as e:
            error_message = {"message": "Invalid JSON data", "error": str(e)}
            return error_message, 400
        except Exception as e:
            error_message = {
                "message": "Failed to push data to Elasticsearch",
                "error": str(e)}
            return error_message, 500

    # Define a method for querying logs
    @api.param("q", "The compressed query data", required=True)
    @api.param("page", "current page number", required=False)
    @api.param("size", "size of pagination", required=False)
    @api.param("sort_field",
               "the sort field, defaults to timestamp",
               required=False)
    @api.param("sort_order",
               "Can be 'asc' or desc, defaults to 'desc'. ",
               required=False)
    @api.response(200, "Data retrieved from Elasticsearch successfully")
    @api.response(400, "Invalid query data")
    @api.response(500, "Failed to retrieve data from Elasticsearch")
    def get(self):
        # print(request.args["q"])
        try:
            # Get the page number (default: 1)
            page = int(request.args.get('page', 1))
            # Get the page size (default: 10)
            size = int(request.args.get('size', 100))
            sort_field = request.args.get(
                'sort_field', "timestamp")  # Get the field to sort by
            # Get the sort order (default: 'asc')
            sort_order = request.args.get('sort_order', 'desc')

            query_data = convert(request.args["q"])
            # query_data = json.loads(query_data)

            # print("query_data", query_data, type(query_data))
            from_index = (page - 1) * size
            sort_dict = [{sort_field: {"order": sort_order}}
                         ] if sort_field else []

            # Perform the search based on the provided query data and
            # pagination
            response = es.search(
                index=index_name,
                body={"query": query_data, "sort": sort_dict},
                from_=from_index,
                size=size
            )
            hits = response.get('hits', {}).get('hits', [])
            total_hits = response.get(
                'hits',
                {}).get(
                'total',
                {}).get(
                'value',
                0)
            print("hits", total_hits)
            return jsonify(
                {"hits": hits, "total_hits": total_hits, "page": page, "size": size})
        except ValueError as e:
            error_message = {"message": "Invalid query data", "error": str(e)}
            return error_message, 400
        except Exception as e:
            error_message = {
                "message": "Failed to retrieve data from Elasticsearch",
                "error": str(e)}
            return error_message, 500


# Define a resource class for the logs by id endpoint
@ns.route("/<string:id>")
class LogsByIdAPI(Resource):
    # Define a method for getting a log by id
    @api.response(200, "Log found by id")
    @api.response(404, "Log not found by id")
    @api.response(500, "Failed to get log by id")
    def get(self, id):
        try:
            # Get the document by id from Elasticsearch
            res = es.get(index=index_name, id=id)
            # Return the document source
            return res['_source']
        except exceptions.NotFoundError as e:
            error_message = {"message": "Log not found by id", "error": str(e)}
            return error_message, 404
        except Exception as e:
            error_message = {
                "message": "Failed to get log by id",
                "error": str(e)}
            return error_message, 500

    @api.response(200, "Log deleted successfully")
    @api.response(404, "Log not found by id")
    @api.response(500, "Failed to delete log by id")
    def delete(self, id):
        try:
            # Delete the document by id from Elasticsearch
            res = es.delete(index=index_name, id=id)
            if res['result'] == 'deleted':
                return jsonify({"message": "Log deleted successfully"})
            else:
                return jsonify({"message": "Log not found by id"})
        except exceptions.NotFoundError as e:
            error_message = {"message": "Log not found by id", "error": str(e)}
            return error_message, 404
        except Exception as e:
            error_message = {
                "message": "Failed to delete log by id",
                "error": str(e)}
            return error_message, 500