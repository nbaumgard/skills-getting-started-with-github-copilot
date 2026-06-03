from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


def test_unregister_participant_removes_email():
    original_participants = activities["Chess Club"]["participants"].copy()

    try:
        response = client.delete("/activities/Chess%20Club/signup?email=michael@mergington.edu")

        assert response.status_code == 200
        assert response.json() == {
            "message": "Removed michael@mergington.edu from Chess Club"
        }
        assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]
    finally:
        activities["Chess Club"]["participants"] = original_participants
