import configparser
import os
from routes.api_routes import blueprint
from flask_cors import CORS
from flask import Flask

config_file = f"config_{os.getenv('env', default='dev')}.cfg"
config = configparser.ConfigParser()
config.read(config_file)
app = Flask(__name__)
app.register_blueprint(blueprint)
CORS(app)

if __name__ == "__main__":
    app.run(
        host=config.get(
            "backend", "host"), port=config.getint(
            "backend", "port"), debug=config.getboolean(
                "backend", "debug"))
