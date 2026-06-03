document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let hideMessageTimer;

  const showMessage = (text, type) => {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    clearTimeout(hideMessageTimer);
    hideMessageTimer = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  };

  const createParticipantItemMarkup = (activityName, email) => `
    <li class="participant-item">
      <span class="participant-email">${email}</span>
      <button
        type="button"
        class="remove-participant"
        data-activity="${activityName}"
        data-email="${email}"
        aria-label="Remove ${email} from ${activityName}"
        title="Remove ${email}"
      >
        ✕
      </button>
    </li>
  `;

  const appendParticipantToCard = (activityName, email) => {
    const activityCard = activitiesList.querySelector(`[data-activity-name="${activityName}"]`);

    if (!activityCard) {
      return;
    }

    const participantsSection = activityCard.querySelector(".participants-section");
    const existingList = participantsSection.querySelector(".participants-list");

    if (existingList) {
      existingList.insertAdjacentHTML("beforeend", createParticipantItemMarkup(activityName, email));
      return;
    }

    const emptyState = participantsSection.querySelector(".participants-empty");
    if (emptyState) {
      emptyState.remove();
    }

    participantsSection.insertAdjacentHTML(
      "beforeend",
      `<ul class="participants-list">${createParticipantItemMarkup(activityName, email)}</ul>`
    );
  };

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;
        const participantItems = participants
          .map((email) => createParticipantItemMarkup(name, email))
          .join("");
        const participantsMarkup = participants.length > 0
          ? `<ul class="participants-list">${participantItems}</ul>`
          : `<p class="participants-empty">No participants yet.</p>`;

        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");

    if (!removeButton) {
      return;
    }

    event.preventDefault();

    const activityName = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        appendParticipantToCard(activity, email);
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
