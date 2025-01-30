import request from "supertest";
import app from "../server";
import odbc from "odbc";
import * as sqlString from "sqlstring";
import * as globalController from "../controllers/global.controller";
import * as globalService from "../services/global.service";
import * as teamupService from "../services/teamup.service";

// ------------------------------------ Global Tests ------------------------------------

describe("globalController", () => {
  let server: any;
  let authToken: string;

  const global_testBody: any[] = [
    {
      userEmail: "mathiasbc97@gmail.com",
      userName: "Mathias Christensen",
      userEvents: [
        {
          email: "mathiasbc97@gmail.com",
          startDate: "2024-12-23T09:00:00+01:00",
          endDate: "2024-12-23T17:00:00+01:00",
          hours: 8,
          subCalendarName: "Office",
        },
        {
          email: "mathiasbc97@gmail.com",
          startDate: "2024-12-22T09:00:00+01:00",
          endDate: "2024-12-22T17:00:00+01:00",
          hours: 8,
          subCalendarName: "Office",
        },
        {
          email: "mathiasbc97@gmail.com",
          startDate: "2024-12-21T09:00:00+01:00",
          endDate: "2024-12-21T17:00:00+01:00",
          hours: 6,
          subCalendarName: "Remote",
        },
      ],
      userTasks: [
        {
          taskHours: 3,
          taskMinutes: 0,
          formattedDate: "2024-12-23T09:22:52.361Z",
          dateLogged: "1734859372361",
          loggedBy: "mathiasbc97@gmail.com",
          taskTitle: "Test",
          clickupTaskID: "86976auxh",
          email: "mathiasbc97@gmail.com",
        },
        {
          taskHours: 3,
          taskMinutes: 0,
          formattedDate: "2024-12-22T09:22:10.488Z",
          dateLogged: "1734859330488",
          loggedBy: "mathiasbc97@gmail.com",
          taskTitle: "Test",
          clickupTaskID: "86976aut8",
          email: "mathiasbc97@gmail.com",
        },
        {
          taskHours: 4,
          taskMinutes: 0,
          formattedDate: "2024-12-21T20:58:54.401Z",
          dateLogged: "1734814734401",
          loggedBy: "mathiasbc97@gmail.com",
          taskTitle: "rapportskrivning",
          clickupTaskID: "869768pvr",
          email: "mathiasbc97@gmail.com",
        },
      ],
    },
  ];

  beforeAll(async () => {
    process.env.DATABASE_DSN = "unitTest";
    const connection = await odbc.connect(`DSN=${process.env.DATABASE_DSN}`);

    await connection.query("DELETE FROM userTable");
    await connection.query("DELETE FROM userEvents");
    await connection.query("DELETE FROM userTasks");
    await connection.close();

    server = app.listen(0);

    const authResponse = await request(app)
      .post("/api/teamup/auth")
      .set("Content-Type", "application/json")
      .set("Teamup-Token", process.env.TEAMUP_API as string);

    expect(authResponse.status).toBe(200);
    authToken = authResponse.body.auth_token;
  });

  afterAll(async () => {
    await server.close();
  });

  const isoStartDate = "#2024-12-28#";
  const isoStartTime = "#09:00:00#";
  const isoEndDate = "#2024-12-28#";
  const isoEndTime = "#17:00:00#";
  const eventHours = "8";
  const safeSubCalendarName = sqlString.escape("Office");

  it("should return user ID when email exists in the database", async () => {
    const testEmail = sqlString.escape("test@example.com");
    const testUserName = sqlString.escape("Test User");
    try {
      await globalService.sendQuery(
        `INSERT INTO userTable (email, userName) VALUES (${testEmail}, ${testUserName})`
      );
      const userID = await globalController.getUserID(testEmail);
      expect(userID).toBeTruthy();
      expect(userID).toBeGreaterThan(0);
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error; // Rethrow to ensure test fails correctly
    }
  });

  it("should return null when email does not exist in the database", async () => {
    try {
      const userID = await globalController.getUserID(
        sqlString.escape("nonexistent@example.com")
      );
      expect(userID).toBeNull();
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it("should update or insert events correctly", async () => {
    const userID = 1;
    const userEvents = [
      {
        startDate: "#2024-12-28#",
        startTime: "#10:00:00#",
        endDate: "#2024-12-28#",
        endTime: "#11:00:00#",
        eventHours: "4",
        subCalendarName: "Office",
      },
    ];
    try {
      const eventIDs = await globalController.handleUserEvents(
        userID,
        userEvents
      );
      expect(eventIDs).toBeInstanceOf(Array);
      expect(eventIDs.length).toBeGreaterThan(0);

      const result = await globalService.sendQuery(
        `SELECT * FROM userEvents WHERE userID = ${userID}`
      );
      expect(result.length).toBeGreaterThan(0);
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it("should handle tasks related to existing events", async () => {
    const userID = 1;
    const userEvents = [
      {
        startDate: "#2024-12-28#",
        startTime: "#09:00:00#",
        endDate: "#2024-12-28#",
        endTime: "#10:00:00#",
        eventHours: "1",
        subCalendarName: "Office",
      },
    ];

    const userTasks = [
      {
        clickupTaskID: "123",
        taskHours: "2",
        taskMinutes: "0",
        formattedDate: "2024-12-28T09:00:00",
        taskTitle: "Test Task",
      },
    ];

    try {
      const eventIDs = await globalController.handleUserEvents(
        userID,
        userEvents
      );
      const taskRelatedToEvent = await globalController.handleUserTasks(
        userID,
        eventIDs,
        userTasks
      );

      const taskCheck = (await globalService.sendQuery(
        `SELECT * FROM userTasks WHERE clickupTaskID = '123'`
      )) as any;
      expect(taskCheck.length).toBeGreaterThan(0);
      expect(taskCheck[0].eventID).toBe(eventIDs[0].eventID);
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it("should not insert an event if the event details are the same", async () => {
    const userID = 1;
    const existingEvent = {
      startDate: "#2024-12-28#",
      startTime: "#09:00:00#",
      endDate: "#2024-12-28#",
      endTime: "#10:00:00#",
      eventHours: "1",
      subCalendarName: "Office",
    };

    // Insert the first event
    const eventIDsBeforeInsert = await globalController.handleUserEvents(
      userID,
      [existingEvent]
    );

    // Attempt to insert the same event again (should not be inserted)
    const eventIDsAfterInsert = await globalController.handleUserEvents(
      userID,
      [existingEvent]
    );

    expect(eventIDsBeforeInsert.length).toBe(1);
    expect(eventIDsBeforeInsert[0].eventID).toBe(
      eventIDsAfterInsert[0].eventID
    ); // Same event ID as before
  });

  it("should correctly update an event if it already exists", async () => {
    const userID = 1;
    const existingEvent = {
      startDate: "#2024-12-28#",
      startTime: "#09:00:00#",
      endDate: "#2024-12-28#",
      endTime: "#10:00:00#",
      eventHours: "1",
      subCalendarName: "Office",
    };

    // Insert the first event
    await globalController.handleUserEvents(userID, [existingEvent]);

    // Update the same event with new details
    const updatedEvent = { ...existingEvent, eventHours: "2" };
    const eventIDs = await globalController.handleUserEvents(userID, [
      updatedEvent,
    ]);

    expect(eventIDs.length).toBe(1);
    expect(eventIDs[0].eventID).toBeTruthy();

    const updatedEventInDb = (await globalService.sendQuery(
      `SELECT * FROM userEvents WHERE ID = ${eventIDs[0].eventID}`
    )) as any;
    expect(updatedEventInDb[0].eventHours).toBe("2");
  });

  it("should correctly insert and update multiple events for a user", async () => {
    const userID = 1;
    const userEvents = [
      {
        startDate: "#2024-12-28#",
        startTime: "#09:00:00#",
        endDate: "#2024-12-28#",
        endTime: "#10:00:00#",
        eventHours: "1",
        subCalendarName: "Office",
      },
      {
        startDate: "#2024-12-28#",
        startTime: "#11:00:00#",
        endDate: "#2024-12-28#",
        endTime: "#12:00:00#",
        eventHours: "1",
        subCalendarName: "Conference",
      },
    ];

    try {
      const eventIDs = await globalController.handleUserEvents(
        userID,
        userEvents
      );
      expect(eventIDs).toBeInstanceOf(Array);
      expect(eventIDs.length).toBe(2);

      const result = await globalService.sendQuery(
        `SELECT * FROM userEvents WHERE userID = ${userID}`
      );
      expect(result.length).toBe(1);
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it("should handle the scenario when no events are provided for a user", async () => {
    const userID = 1;
    const userEvents: any[] = [];

    try {
      const eventIDs = await globalController.handleUserEvents(
        userID,
        userEvents
      );
      expect(eventIDs).toEqual([]);
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it("should insert a new user if the email doesn't exist", async () => {
    const testEmail = sqlString.escape("newuser@example.com");
    const testUserName = sqlString.escape("New User");

    try {
      const userID = await globalController.getUserID(testEmail);
      if (!userID) {
        const userID = await globalController.insertNewUser(
          testEmail,
          testUserName
        );
        expect(userID).toBeTruthy();
        const userCheck = await globalService.sendQuery(
          `SELECT * FROM UserTable WHERE email = ${testEmail}`
        );
        expect(userCheck.length).toBe(1);
      }
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it("should insert an event and return the event ID", async () => {
    const userID = 1;
    try {
      const eventID = await globalController.insertEvent(
        userID,
        isoStartDate,
        isoStartTime,
        isoEndDate,
        isoEndTime,
        eventHours,
        safeSubCalendarName
      );

      expect(eventID).toBeGreaterThan(0);

      const result = await globalService.sendQuery(
        `SELECT * FROM userEvents WHERE ID = ${eventID}`
      );
      expect(result.length).toBeGreaterThan(0);
    } catch (error) {
      console.error("Error during test execution: ", error);
      throw error;
    }
  });

  it('should run a "normal" request from the frontend', async () => {
    const data = await globalController.updateFromScheduler();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty("userEmail");
    expect(data[0]).toHaveProperty("userName");
    expect(data[0]).toHaveProperty("userEvents");
    expect(data[0]).toHaveProperty("userTasks");

    expect(typeof data[0].userEmail).toBe("string");
    expect(typeof data[0].userName).toBe("string");
    expect(typeof data[0].userEvents).toBe("object");
    expect(typeof data[0].userTasks).toBe("object");
  });

  it("should run updateMSaccess function", async () => {
    expect(Array.isArray(global_testBody[0].userEvents)).toBe(true);

    const result = await globalController.updateMSAccessDatabase(
      global_testBody
    );
    expect(result).toBe("OK");
  });

  it("should run updateMSaccess function, but return with error", async () => {
    expect(Array.isArray(global_testBody[0].userEvents)).toBe(true);

    try {
      await globalController.updateMSAccessDatabase(global_testBody);
    } catch (error) {
      // Step 4: Check that the error was correctly thrown
      expect(error).toBeInstanceOf(Error);
      console.log(error);
    }
  });
});

describe("ClickUp and Teamup tests", () => {
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    server = app.listen(0);

    const authResponse = await request(app)
      .post("/api/teamup/auth")
      .set("Content-Type", "application/json")
      .set("Teamup-Token", process.env.TEAMUP_API as string);

    expect(authResponse.status).toBe(200);
    authToken = authResponse.body.auth_token;
  });

  afterAll(async () => {
    await server.close();
  });

  // ------------------------------------ TeamUp Tests ------------------------------------

  it("should return an array of events when authenticated", async () => {
    const response = await request(app)
      .get("/api/teamup/userEvents/mathiasbc97@gmail.com")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    response.body.forEach((event: any) => {
      expect(typeof event).toBe("object");
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("startDate");
      expect(event).toHaveProperty("endDate");
      expect(event).toHaveProperty("timezone");
      expect(event).toHaveProperty("custom");
      expect(event.custom).toHaveProperty("email");

      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      expect(startDate.toLocaleString()).toBe(
        new Date(event.startDate).toLocaleString()
      );
      expect(endDate.toLocaleString()).toBe(
        new Date(event.endDate).toLocaleString()
      );

      expect(startDate < endDate).toBe(true);
    });

    const ids = response.body.map((event: any) => event.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should get users", async () => {
    const response = await request(app)
      .get(`/api/teamup/searchUser/eqv4en`)
      .set({
        "Teamup-Token": process.env.TEAMUP_API,
        Authorization: `Bearer ${authToken}`,
      });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    response.body.forEach((user: any) => {
      expect(typeof user).toBe("object");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
    });
  });

  it("should get subcalendars", async () => {
    const response = await request(app)
      .get(`/api/teamup/subcalendars`)
      .set({
        "Teamup-Token": process.env.TEAMUP_API,
        Authorization: `Bearer ${authToken}`,
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    response.body.forEach((sub: any) => {
      expect(typeof sub).toBe("object");
      expect(sub).toHaveProperty("id");
      expect(sub).toHaveProperty("name");
      expect(sub).toHaveProperty("active");
      expect(sub).toHaveProperty("color");

      expect(typeof sub.id).toBe("number");
      expect(typeof sub.name).toBe("string");
      expect(typeof sub.active).toBe("boolean");
      expect(typeof sub.color).toBe("number");

      expect(sub.name).not.toBe("");
    });

    const ids = response.body.map((sub: any) => sub.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should return an error message when fetching events fails", async () => {
    // Mock the service to throw an error
    jest
      .spyOn(teamupService, "fetchTeamupUserEvents")
      .mockImplementation(() => {
        throw new Error("Failed to fetch events");
      });

    const response = await request(app)
      .get("/api/teamup/userEvents/mathiasbc97@gmail.com")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Failed to fetch events");
  });
  it("should return an empty array when no events are found", async () => {
    // Mock the service to return empty events
    jest
      .spyOn(teamupService, "fetchTeamupUserEvents")
      .mockResolvedValue({ events: [] });

    const response = await request(app)
      .get("/api/teamup/userEvents/mathiasbc97@gmail.com")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should return events for the current week when no startDate and endDate are provided", async () => {
    const response = await request(app)
      .get("/api/teamup/userEvents/mathiasbc97@gmail.com")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Add assertions to verify the events are for the current week
  });

  // ------------------------------------ ClickUp Tests ------------------------------------

  it("should return a list of members with status 200", async () => {
    const response = await request(app).get("/api/clickup/members");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(0);

    if (response.body.length > 0) {
      response.body.forEach((member: any) => {
        expect(member).toHaveProperty("email");
        expect(member).toHaveProperty("name");
      });
    }
  });

  it("should return tasks for a user using email and status 200", async () => {
    const response = await request(app).get(
      "/api/clickup/tasks/kasper.schmidt1@hotmail.com"
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0].loggedBy).toBe("kasper.schmidt1@hotmail.com");
      expect(response.body[0]).toHaveProperty("taskTitle");
    }
  });

  it("should not return tasks for a user using non-existing email and status 500", async () => {
    const response = await request(app).get(
      "/api/clickup/tasks/test@hotmail.com"
    );

    expect(response.status).toBe(500);
    expect(Array.isArray(response.body)).toBe(false);
    expect(typeof response.body).toBe("object");
    expect(response.body.error).toBe(
      "No Tasks found for email: test@hotmail.com"
    );
  });

  it("should return 400 if email does not exist in the members list", async () => {
    const response = await request(app).get("/api/clickup/members");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const members = response.body;
    const memberExists = members.some(
      (member: any) => member.email === "test@gmail.com"
    );

    expect(memberExists).toBe(false);
  });

  it("should return an empty array if no members are found", async () => {
    process.env.CLICKUP_API = "falseTest";

    const response = await request(app).get("/api/clickup/members");

    expect(response.status).toBe(500);
    expect(Array.isArray(response.body)).toBe(false);
  });
});
