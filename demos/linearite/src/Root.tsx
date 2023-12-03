import App from './App'
import { DBProvider } from "@vlcn.io/react";
import schemaContent from "./domain/schema.sql?raw";
import { DBName, SchemaName } from './domain/Schema';

export default function Root() {
  return (
    <DBProvider
      dbname={DBName}
      schema={{
        name: SchemaName,
        content: schemaContent,
      }}
      Render={() => <App />}
  />)
}
