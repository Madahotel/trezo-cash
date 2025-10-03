import { Line } from "react-chartjs-2";

const ScenarioChart = ({ periods, baseData, scenarioData }) => {
  const data = {
    labels: periods,
    datasets: [
      {
        label: "Solde Réel (Base)",
        data: baseData,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.3,
        borderWidth: 2,
      },
      ...scenarioData.map((sc) => ({
        label: sc.name,
        data: sc.data,
        borderColor: sc.color,
        borderDash: [5, 5],
        backgroundColor: sc.color,
        tension: 0.3,
        borderWidth: 2,
      })),
    ],
  };

  const options = { 
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { ticks: { maxRotation: 30, minRotation: 30 } },
      y: { ticks: { stepSize: 100 } },
    },
  };

  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow">
      <Line data={data} options={options} />
    </div>
  );
};

export default ScenarioChart;
