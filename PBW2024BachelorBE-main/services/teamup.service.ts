import fetch from "node-fetch";

export const fetchTeamupUserEvents = async (
  email: string,
  startDate: string,
  endDate: string
) => {
  try {
    // Henter events fra specifik kalender, identificeret ved TEAMUP_CALENDARID, baseret på mail, startDate og endDate
    const url = `${process.env.TEAMUP_URL}${process.env.TEAMUP_CALENDARID}/events?query=${email}&startDate=${startDate}&endDate=${endDate}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.TEAMUP_API as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    return {
      statusText:
        "Something went wrong when fetching from fetchTeamupUserEvents",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};

export const fetchTeamupUsers = async (calendarId: string) => {
  try {
    const url = `${process.env.TEAMUP_URL}${calendarId}/users`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.TEAMUP_API as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log(
        `something went wrong with request: Error: ${response.status} ${response.statusText}`
      );

      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    console.error("error when calling fetchTeamupUsers() ", error);

    return {
      statusText: "Something went wrong when fetching from fetchTeamupUsers",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};

export const fetchTeamupSubCalendars = async () => {
  try {
    const url = `${process.env.TEAMUP_URL}${process.env.TEAMUP_CALENDARID}/subcalendars`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Teamup-Token": process.env.TEAMUP_API as string,
        Authorization: `Bearer ${process.env.TEAMUP_AUTH as string}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    return {
      statusText:
        "Something went wrong when fetching from fetchTeamupSubCalendars",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};

export const fetchTeamupAuth = async () => {
  try {
    const url = `${process.env.TEAMUP_URL}auth/tokens`;
    const teamup_api = process.env.TEAMUP_API as string;

    const bodyObj = JSON.stringify({
      email: process.env.TEAMUP_USER as string,
      password: process.env.TEAMUP_PASS as string,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Teamup-Token": teamup_api,
        "Content-Type": "application/json",
      },
      body: bodyObj,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    return {
      statusText: "Something went wrong when authenticaing teamup",
      error: error.message,
      ok: false,
      status: 500,
    };
  }
};
