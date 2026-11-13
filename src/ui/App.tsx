import { greetingFor } from '../domain/greeting';
import { strings } from '../domain/strings';

// Placeholder screen: replace it with the app's first screen (BOOTSTRAP.md).
export function App() {
  return (
    <main className="app">
      <h1>{strings.appName}</h1>
      <p>{greetingFor(new Date())}</p>
    </main>
  );
}
