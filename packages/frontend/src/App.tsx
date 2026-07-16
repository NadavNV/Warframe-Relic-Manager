import MainTable from "./components/MainTable";

export default function App() {
  // State is lifted here so both components can access it

  return (
    <div>
      <MainTable />
    </div>
  );
}
