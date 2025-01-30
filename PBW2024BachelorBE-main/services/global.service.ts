let odbc: any;

if (process.env.NODE_ENV !== "production") {
  // Only require odbc in local environments
  odbc = require("odbc");
}

export const sendQuery = async (query: string) => {
  try {
    let result;

    if (odbc) {
      // Use odbc connection only if it's available (i.e., in local dev environment)
      const connection = await odbc.connect(`DSN=${process.env.DATABASE_DSN}`);
      result = await connection.query(query);
      await connection.close();
    } else {
      // Handle the production case where odbc is not used (e.g., use a different DB client)
      console.log("Production environment - odbc not available");
      // Implement a fallback database connection here for production if necessary
    }

    return result;
  } catch (error: any) {
    console.log("Query error:", error);
    throw new Error(error);
  }
};
