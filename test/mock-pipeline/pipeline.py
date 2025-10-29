import subprocess
import sys
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PY_APP_DIR = PROJECT_ROOT / "test" / "python-app"
IMAGE_NAME = "demo-python-app:latest"
CONTAINER_NAME = "demo-python-app-pipeline"
HOST_PORT = "8001"  # avoid clashing with a dev instance on 8000
CONTAINER_PORT = "8000"


def run(cmd, cwd=None, check=True):
    print(f"$ {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=cwd, check=check)


def build_image():
    print("\n==> BUILD: Docker image from test/python-app")
    run(["docker", "build", "-t", IMAGE_NAME, "."], cwd=str(PY_APP_DIR))


def start_container():
    print("\n==> DEPLOY: Start container")
    # Stop any existing container with the same name
    subprocess.run(["docker", "rm", "-f", CONTAINER_NAME], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    run([
        "docker", "run", "-d", "--rm",
        "-p", f"{HOST_PORT}:{CONTAINER_PORT}",
        "--name", CONTAINER_NAME,
        IMAGE_NAME,
    ])


def verify_health():
    print("\n==> TEST: Verify /health endpoint")
    import urllib.request
    import json

    url = f"http://localhost:{HOST_PORT}/health"
    deadline = time.time() + 30
    last_error = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url) as resp:
                body = resp.read().decode("utf-8")
                data = json.loads(body)
                if data.get("status") == "ok":
                    print("Health check passed:", data)
                    return
                last_error = f"Unexpected body: {data}"
        except Exception as e:
            last_error = str(e)
        time.sleep(1)
    raise RuntimeError(f"Health check failed: {last_error}")


def show_logs():
    print("\n==> LOGS: Container output (last 50 lines)")
    subprocess.run(["docker", "logs", "--tail", "50", CONTAINER_NAME])


def cleanup():
    print("\n==> CLEANUP: Stop container")
    subprocess.run(["docker", "stop", CONTAINER_NAME])


def main():
    try:
        print("Mock CI/CD Pipeline using existing Dockerfile and app in test/python-app")
        print(f"Project root: {PROJECT_ROOT}")
        print(f"Using app directory: {PY_APP_DIR}")

        # Stages
        print("\n--- Stage: Checkout")
        if not (PY_APP_DIR / "Dockerfile").exists():
            print("ERROR: Dockerfile not found in test/python-app")
            sys.exit(1)
        print("Repository checked out (local workspace)")

        print("\n--- Stage: Build")
        build_image()

        print("\n--- Stage: Deploy to Test")
        start_container()

        print("\n--- Stage: Integration Tests")
        verify_health()
        show_logs()

        print("\n--- Stage: Teardown")
        cleanup()

        print("\nPipeline completed successfully ✅")
    except Exception as e:
        print(f"\nPipeline failed ❌: {e}")
        # Try to show logs and cleanup even on failure
        try:
            show_logs()
        except Exception:
            pass
        try:
            cleanup()
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    main()

import os
import sys
import time
from typing import List


STAGES: List[str] = [
    "checkout",
    "install-deps",
    "lint",
    "test",
    "build",
    "package",
    "deploy",
]


def log(msg: str) -> None:
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def run_stage(stage: str, duration_s: float) -> None:
    log(f"==> Starting stage: {stage}")
    # Simulate work
    steps = max(1, int(duration_s / 0.25))
    for i in range(steps):
        time.sleep(duration_s / steps)
        print(f"  - {stage}: step {i+1}/{steps}", flush=True)
    log(f"✔ Completed stage: {stage}")


def main() -> int:
    fail_at = os.getenv("FAIL_AT_STAGE", "").strip().lower()
    sleep_per_stage = float(os.getenv("SLEEP_PER_STAGE", "1.0"))
    git_sha = os.getenv("GIT_COMMIT", "abcdef1").strip()
    env = os.getenv("ENV", "staging").strip()

    log("Mock CI/CD pipeline starting")
    log(f"Commit: {git_sha}")
    log(f"Target environment: {env}")

    for stage in STAGES:
        if fail_at and stage == fail_at:
            log(f"❌ Failing intentionally at stage: {stage}")
            return 1
        run_stage(stage, sleep_per_stage)

    log("🎉 Pipeline succeeded end-to-end")
    return 0


if __name__ == "__main__":
    sys.exit(main())


