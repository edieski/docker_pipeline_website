from flask import Flask, jsonify, render_template

app = Flask(__name__)


@app.get("/")
def root():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify(status="learning docker and pipelines"), 200


if __name__ == "__main__":
    # For local runs without Docker; Docker will use the same host/port
    app.run(host="0.0.0.0", port=8000)


