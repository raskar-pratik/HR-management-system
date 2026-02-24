import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Types
interface DashboardChartsProps {
    attendanceData?: {
        labels: string[];
        present: number[];
        absent: number[];
    };
    leaveDistribution?: {
        labels: string[];
        data: number[];
    };
    headcount?: {
        departments: string[];
        counts: number[];
    };
    monthlyRate?: {
        labels: string[];
        rate: number[];
    };
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
    attendanceData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        present: [45, 48, 47, 46, 45, 20, 15],
        absent: [5, 2, 3, 4, 5, 30, 35]
    },
    leaveDistribution = {
        labels: ['Annual', 'Sick', 'Casual', 'Unpaid', 'Maternity'],
        data: [12, 5, 8, 2, 1]
    },
    headcount = {
        departments: ['Engineering', 'HR', 'Sales', 'Marketing', 'Support'],
        counts: [25, 5, 15, 10, 8]
    },
    monthlyRate = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        rate: [95, 96, 94, 95, 97, 96]
    }
}) => {

    // 1. Attendance Trend (Line Chart)
    const attendanceChartData = {
        labels: attendanceData.labels,
        datasets: [
            {
                label: 'Present',
                data: attendanceData.present,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                tension: 0.3
            },
            {
                label: 'Absent',
                data: attendanceData.absent,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                tension: 0.3
            }
        ]
    };

    const lineOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false, text: 'Weekly Attendance Trend' }
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    // 2. Leave Distribution (Pie Chart)
    const leaveChartData = {
        labels: leaveDistribution.labels,
        datasets: [
            {
                label: 'Leaves Taken',
                data: leaveDistribution.data,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(251, 191, 36, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(139, 92, 246, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // 3. Department Headcount (Bar Chart)
    const headcountChartData = {
        labels: headcount.departments,
        datasets: [
            {
                label: 'Employees',
                data: headcount.counts,
                backgroundColor: 'rgba(79, 70, 229, 0.7)', // Indigo
            }
        ]
    };

    const barOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    // 4. Monthly Attendance Rate (Line Chart)
    const rateChartData = {
        labels: monthlyRate.labels,
        datasets: [
            {
                label: 'Attendance Rate (%)',
                data: monthlyRate.rate,
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">

            {/* Attendance Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Attendance Trend</h3>
                <div className="h-64">
                    <Line options={lineOptions} data={attendanceChartData} />
                </div>
            </div>

            {/* Leave Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Distribution</h3>
                <div className="h-64 flex justify-center">
                    <Pie data={leaveChartData} />
                </div>
            </div>

            {/* Department Headcount */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Headcount</h3>
                <div className="h-64">
                    <Bar options={barOptions} data={headcountChartData} />
                </div>
            </div>

            {/* Monthly Attendance Rate */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Attendance Rate</h3>
                <div className="h-64">
                    <Line options={lineOptions} data={rateChartData} />
                </div>
            </div>

        </div>
    );
};

export default DashboardCharts;
