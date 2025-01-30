import * as teamupService from "../services/teamup.service";
import { getCurrentWeek } from "../utils/helper-utils";

export const getTeamupUserEvents = async (req: any, res: any) => {
  const email = req.params.email;                                       // Hent brugerens email fra URL-parametre
  const { startDate, endDate } = req.query;                             // Hent start- og slutdato fra forespørgelsesparametre

  // Hvis ingen startDate og endDate, default til getCurrentWeek
  const { startOfWeek, endOfWeek } =
    startDate && endDate
      ? { startOfWeek: startDate, endOfWeek: endDate }
      : getCurrentWeek();                                               // Få start- og slutdato for den nuværende uge
  try {
    const response = await teamupService.fetchTeamupUserEvents(
      email,
      startOfWeek,
      endOfWeek
    ); // Hent events fra TeamUp API'et

    const data = await response;  // Vent på svar fra API'et

    // Mapper events til nyt format med relevante oplysninger
    const userEvents = data.events.map((event: any) => {
      return {
        id: event.id,                       // Event ID
        subcalenderId: event.subcalendar_id, // Subkalender ID
        all_day: event.all_day,             // Hvis eventet er hele dagen
        rrule: event.rrule,                 // Gentagelsesregel
        title: event.title,                 // Event titel
        timezone: event.tz,                 // Tidszone
        startDate: event.start_dt,          // Startdato
        endDate: event.end_dt,              // Slutdato
        custom: event.custom,               // Event specifik information
      };
    });

    res.status(200).json(userEvents);  // Returner events i JSON-format
  } catch (error: any) {
    console.error("Fejl ved hentning af events:", error.message); // Log fejl
    res.status(500).json({ error: error.message });               // Returner fejlbesked
  }
};

// Henter alle brugere på TeamUp
export const getTeamupUsers = async (req: any, res: any) => {
  try {
    // Hent alle brugere og mapper dem til nyt format med array for email og navn
    const data = await teamupService.fetchTeamupUsers(req.params.calendarId);

    const users = data.users.map((user: any) => {
      return {
        email: user.members[0].email, // Brugerens email
        name: user.name,              // Brugerens navn
      };
    });

    res.status(200).json(users);  // Returner brugerdata i JSON-format
  } catch (error: any) {
    console.error("Fejl ved hentning af brugere:", error.message); // Log fejl
    res.status(500).json({ error: error.message });                // Returner fejlbesked
  }
};

// Henter underkalendere for en specifik kalender fra TeamUp API'et.
export const getTeamupSubcalenders = async (req: any, res: any) => {
  try {
    const data = await teamupService.fetchTeamupSubCalendars(); // Hent subkalendere

    const subCalendars = data.subcalendars.map((calendar: any) => {
      return {
        id: calendar.id,                // Kalender ID
        name: calendar.name,            // Kalender navn
        active: calendar.active,        // Aktiv status
        color: calendar.color,          // Kalender farve
      };
    });
    res.status(200).json(subCalendars);  // Returner subkalenderdata i JSON-format
  } catch (error: any) {
    console.error("Fejl ved hentning af underkalendere:", error.message); // Log fejl
    res.status(500).json({ error: error.message });                    // Returner fejlbesked
  }
};

// Funktion som sender en POST-anmodning til TeamUp API'et for at få en autentificeringstoken
// Anmodningen inkluderer loginoplysninger i JSON-format i body'en, samt en TeamUp API-token i headeren
export const getTeamupAuth = async (req: any, res: any) => {
  try {
    const response = await teamupService.fetchTeamupAuth(); // Hent autentificeringstoken

    process.env.TEAMUP_AUTH = response.auth_token; // Gem token i miljøvariabler

    res.status(200).json({
      message: "Token gemt succesfuldt",  // Returner succesbesked
      auth_token: response.auth_token,   // Returner token
    });
  } catch (error: any) {
    console.log("Fejl i getTeamupAuth()");  // Log fejl
    res.status(500).json({ error: error.message });  // Returner fejlbesked
  }
};
