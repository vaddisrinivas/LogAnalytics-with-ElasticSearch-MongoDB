import json
import base64
import gzip
import urllib.parse

# Function to convert JSON data to compressed query
def reconvert(data):
    text_data = json.dumps(data).encode('utf-8')
    compressed_data = gzip.compress(text_data)
    encoded_data = base64.b64encode(compressed_data)
    url_encoded_data = urllib.parse.quote(encoded_data)
    return url_encoded_data

queries = [({"match_all": {}},1, 20),
            ({"bool": {"must": [{"match": {"level": "error"}},{"match": {"message": "authentication"}}]}}, 2, 5),
             ({"bool": {"must": [{"range": {"timestamp": {"gte": "2023-10-01", "lte": "2023-10-31"}}},{"term": {"level": "warning"}}]}}, 1, 2),
            ({"match_phrase": {"message": "server error"}}, 3, 10)]
final_queries = []
for query, page, size in queries:
    final_queries.append((reconvert(query),page, size))





"""
Queries:

1
{
    "match_all": {}
}

2
{
    "bool": {
        "must": [
            {"match": {"level": "error"}},
            {"match": {"message": "authentication"}}
        ]
    }
}


3
{
    "query": {
        "bool": {
            "must": [
                {"range": {"timestamp": {"gte": "2023-10-01", "lte": "2023-10-31"}}},
                {"term": {"level": "warning"}}
            ]
        }
    }
}

4
{
    "query": {
        "match_phrase": {"message": "server error"}
    }
}
"""