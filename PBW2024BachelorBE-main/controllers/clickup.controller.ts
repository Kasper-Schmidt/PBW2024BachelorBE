import * as clickupService from "../services/clickup.service";          // Importerer funktioner fra ClickUp-service
import {
  extractTrackedTimeInfo,
  getTaskTimeEntries,
} from "../utils/helper-utils";                                         // Importerer hjælpefunktioner til at håndtere tidsdata

export const getClickUpTasksFromList = async (req: any, res: any) => {  // Endpoint til at hente en liste af opgaver for en specifik bruger baseret på email
  try {
    const userEmail = req.params.email;                                 // Henter email fra request-parametrene
    const data = await clickupService.fetchClickupTasksFromList();      // Kalder ClickUp-servicen for at hente data om opgaver
    const tasks = data.tasks || [];                                     // Ekstraherer opgavelisten eller bruger en tom liste, hvis der ingen opgaver findes

    const userTrackedTime = (                                           // Henter tidsregistreringer for opgaver tildelt til den specifikke bruger
      await Promise.all(
        tasks
          .filter(                                                      // Filtrerer opgaverne for dem, der er tildelt den bruger, hvis email matcher
            (task: any) =>
              task.assignees &&
              task.assignees.some(
                (assignee: any) => assignee.email === userEmail
              )
          )
          .map(async (task: any) => {                                   // Mapper over de filtrerede opgaver for at hente tidsregistreringer
            const timeEntries = await getTaskTimeEntries(task.id);      // Henter tidsdata for en specifik opgave
            return timeEntries.map((entry: any) => ({
              ...extractTrackedTimeInfo(entry),                         // Spreder og tilføjer ekstra information til hver tidsregistrering
              taskTitle: task.name,                                     // Tilføjer opgavens navn
              clickupTaskID: task.id,                                   // Tilføjer opgavens ID
              email: userEmail,                                         // Tilføjer brugerens email
            }));
          })
      )
    ).flat();                                                           // Samler alle tidsregistreringer i én flad liste

    if (!userTrackedTime.length) {                                      // Hvis der ikke findes nogen tidsregistreringer, kaster en fejl
      throw new Error(`No Tasks found for email: ${userEmail}`);
    }

    res.status(200).json(userTrackedTime);                              // Sender en succesfuld respons med tidsdata som JSON
  } catch (error: any) {
    res.status(500).json({ error: error.message });                     // Sender en fejlrespons med fejlbesked
  }
};

export const getClickupListUsers = async (req: any, res: any) => {     // Endpoint til at hente en liste af brugere fra ClickUp
  try {
    const data = await clickupService.fetchClickupListUsers();         // Kalder ClickUp-servicen for at hente brugerliste
    const users = data.members.map((user: any) => {                    // Mapper over medlemmer og formatterer data til email og navn
      return {
        email: user.email,                                             // Tilføjer brugerens email
        name: user.username,                                           // Tilføjer brugerens brugernavn
      };
    });
    res.status(200).json(users);                                       // Sender en succesfuld respons med brugerdata som JSON
  } catch (error: any) {
    res.status(500).json({ error: error.message });                    // Sender en fejlrespons med fejlbesked
  }
};
