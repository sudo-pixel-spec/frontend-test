export default function SubjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="text-white/50 p-8">Subject: {params.id}</div>
  );
}
