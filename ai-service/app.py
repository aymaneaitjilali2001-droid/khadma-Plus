import os

from flask import Flask
from dotenv import load_dotenv

from docling_service.routes import api


load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024
    app.register_blueprint(api)
    return app


app = create_app()


if __name__ == '__main__':
    app.run(
        host=os.getenv('DOCLING_HOST', '127.0.0.1'),
        port=int(os.getenv('DOCLING_PORT', '8000')),
        debug=False,
    )
