import AtriumServicesTable from './components/AtriumServicesTable';

export default function AtriumServicesJarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Atrium Services</h1>
        <AtriumServicesTable />
      </div>
    </div>
  );
}