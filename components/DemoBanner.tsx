type DemoBannerProps = {
  message?: string;
};

export default function DemoBanner({ message }: DemoBannerProps) {
  return (
    <div className="notice info demo-banner">
      <strong>Demo mode:</strong>{" "}
      {message ?? "Showing sample data while the backend is offline."}
    </div>
  );
}
