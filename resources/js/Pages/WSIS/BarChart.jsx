import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const BarChart = () => {
  const data = {
    labels: ['BO01', 'BG02', 'BG02', 'GT01'],
    datasets: [
      {
        label: 'Hours',
        data: [65, 59, 80, 81],
        backgroundColor: [
          'rgba(247, 211, 26, 0.9)',
          'rgba(234, 179, 8, 0.9)',
          'rgba(202, 138, 4, 0.9)',
          'rgba(18, 23, 30, 0.85)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return <Bar options={options} data={data} />;
};