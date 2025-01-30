import fetch from "node-fetch";

export const fetchClickupTasksFromList = async () => {
  try {
    const url = `${process.env.CLICKUP_URL}v2/list/${process.env.CLICKUP_LISTID}/task`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: process.env.CLICKUP_API as string,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = response.json();
    return data;

    //return response.json();
  } catch (error: any) {
    console.log(error);

    throw new Error("Error when fetching tasks from fetchClickupTasksList()");
  }
};

export const fetchClickupListUsers = async () => {
  try {
    const url = `${process.env.CLICKUP_URL}v2/list/${process.env.CLICKUP_LISTID}/member`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: process.env.CLICKUP_API as string,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {}
};

export const fetchTaskTimeEntries = async (taskID: string) => {
  try {
    const url = `${process.env.CLICKUP_URL}v2/task/${taskID}/time`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: process.env.CLICKUP_API as string,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Error fetching time entries for task ${taskID}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error: any) {}
};
