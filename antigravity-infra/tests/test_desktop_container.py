import pytest
import docker
import time
import requests

@pytest.fixture(scope="session")
def docker_client():
    return docker.from_env()

@pytest.fixture(scope="session")
def build_image(docker_client):
    print("Building image webix-desktop:test...")
    image, build_logs = docker_client.images.build(
        path="../desktop",
        tag="webix-desktop:test",
        rm=True
    )
    return image

@pytest.fixture(scope="function")
def desktop_container(docker_client, build_image):
    container = docker_client.containers.run(
        "webix-desktop:test",
        detach=True,
        ports={'6080/tcp': 6080},
        environment={
            "VNC_PASSWORD": "testpassword",
            "VNC_RESOLUTION": "1280x720"
        },
        shm_size='512m'
    )
    
    # Wait for the container's services to start
    # We will poll the HTTP endpoint up to 30 seconds
    timeout = 30
    start_time = time.time()
    ready = False
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get("http://localhost:6080/")
            if response.status_code == 200:
                ready = True
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
            
    if not ready:
        print(container.logs().decode('utf-8'))
        container.stop()
        container.remove()
        pytest.fail("Container did not become ready in time.")
        
    yield container
    
    container.stop()
    container.remove()

def test_container_running(desktop_container):
    assert desktop_container.status == "created" or desktop_container.status == "running"

def test_novnc_reachable(desktop_container):
    # If the fixture succeeded, we already know we can get a 200 OK from port 6080,
    # but let's formally assert it in a test.
    response = requests.get("http://localhost:6080/vnc.html")
    assert response.status_code == 200
    assert "noVNC" in response.text
