import React from 'react';

interface VisitorDetailProps {
  id: string;
}

export function VisitorDetail({ id }: VisitorDetailProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Visitor Detail</h1>
      <p>Visitor ID: {id}</p>
      <p>This component is under development.</p>
    </div>
  );
}

export default VisitorDetail;
