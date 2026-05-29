from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture(autouse=True)
def restore_activities():
    original_activities = deepcopy(activities)

    yield

    activities.clear()
    activities.update(original_activities)


@pytest.fixture
def client():
    return TestClient(app)


class TestActivitiesAPI:
    def test_get_activities_returns_expected_activity_names(self, client):
        # Arrange
        expected_activity_names = {
            "Chess Club",
            "Programming Class",
            "Gym Class",
            "Basketball Team",
            "Swimming Club",
            "Art Club",
            "Drama Club",
            "Math Olympiad",
            "Science Club",
        }

        # Act
        response = client.get("/activities")

        # Assert
        assert response.status_code == 200
        payload = response.json()
        assert set(payload.keys()) == expected_activity_names

    def test_signup_adds_new_participant(self, client):
        # Arrange
        email = "newstudent@mergington.edu"
        activity_name = "Chess Club"
        initial_count = len(activities[activity_name]["participants"])

        # Act
        response = client.post(
            f"/activities/{activity_name.replace(' ', '%20')}/signup",
            params={"email": email},
        )

        # Assert
        assert response.status_code == 200
        assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
        assert email in activities[activity_name]["participants"]
        assert len(activities[activity_name]["participants"]) == initial_count + 1

    def test_signup_duplicate_email_returns_400(self, client):
        # Arrange
        email = "michael@mergington.edu"
        activity_name = "Chess Club"
        initial_count = len(activities[activity_name]["participants"])

        # Act
        response = client.post(
            f"/activities/{activity_name.replace(' ', '%20')}/signup",
            params={"email": email},
        )

        # Assert
        assert response.status_code == 400
        assert response.json() == {"detail": "Student already signed up for this activity"}
        assert len(activities[activity_name]["participants"]) == initial_count

    def test_signup_for_missing_activity_returns_404(self, client):
        # Arrange
        activity_name = "Nonexistent Activity"

        # Act
        response = client.post(
            f"/activities/{activity_name.replace(' ', '%20')}/signup",
            params={"email": "student@mergington.edu"},
        )

        # Assert
        assert response.status_code == 404
        assert response.json() == {"detail": "Activity not found"}

    def test_unregister_removes_registered_participant(self, client):
        # Arrange
        email = "michael@mergington.edu"
        activity_name = "Chess Club"
        initial_count = len(activities[activity_name]["participants"])

        # Act
        response = client.delete(
            f"/activities/{activity_name.replace(' ', '%20')}/signup",
            params={"email": email},
        )

        # Assert
        assert response.status_code == 200
        assert response.json() == {"message": f"Removed {email} from {activity_name}"}
        assert email not in activities[activity_name]["participants"]
        assert len(activities[activity_name]["participants"]) == initial_count - 1

    def test_unregister_missing_email_returns_400(self, client):
        # Arrange
        email = "not_registered@mergington.edu"
        activity_name = "Chess Club"
        initial_count = len(activities[activity_name]["participants"])

        # Act
        response = client.delete(
            f"/activities/{activity_name.replace(' ', '%20')}/signup",
            params={"email": email},
        )

        # Assert
        assert response.status_code == 400
        assert response.json() == {"detail": "Student is not signed up for this activity"}
        assert len(activities[activity_name]["participants"]) == initial_count
