import { Injectable } from '@angular/core';
import { ChartData } from 'chart.js';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  fill?: boolean;
}

export interface ChartTicks {
  color?: string;
  font?: {
    size?: number;
  };
  callback?: (value: unknown, index: number, values: unknown[]) => string;
}

export type ChartScales = Record<
  string,
  {
    beginAtZero?: boolean;
    grid?: {
      display?: boolean;
      color?: string;
    };
    ticks?: ChartTicks;
  }
>;

export interface ChartConfigOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'left' | 'bottom' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
    tooltip?: {
      enabled?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
  };
  scales?: ChartScales;
  interaction?: {
    intersect?: boolean;
    mode?: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
  };
}

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  private readonly colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF',
    '#4BC0C0',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
  ];

  private readonly darkColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#7C7C7C',
    '#4BC0C0',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
  ];

  generateColors(count: number, isDark = false): string[] {
    const palette = isDark ? this.darkColors : this.colors;
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(palette[i % palette.length]);
    }
    return result;
  }

  getBaseChartOptions(isDark = false): ChartConfigOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? '#374151' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#1f2937',
          bodyColor: isDark ? '#ffffff' : '#1f2937',
          borderColor: isDark ? '#6b7280' : '#e5e7eb',
          borderWidth: 1,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };
  }

  getPieChartOptions(isDark = false): ChartConfigOptions {
    return {
      ...this.getBaseChartOptions(isDark),
      plugins: {
        ...this.getBaseChartOptions(isDark).plugins,
        legend: {
          display: true,
          position: 'right',
        },
      },
    };
  }

  getBarChartOptions(isDark = false): ChartConfigOptions {
    return {
      ...this.getBaseChartOptions(isDark),
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            display: true,
            color: isDark ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: isDark ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            font: {
              size: 12,
            },
            callback: function (value: unknown) {
              return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(Number(value));
            },
          },
        },
      },
    };
  }

  getLineChartOptions(isDark = false): ChartConfigOptions {
    return {
      ...this.getBaseChartOptions(isDark),
      scales: {
        x: {
          grid: {
            display: true,
            color: isDark ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: isDark ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            font: {
              size: 12,
            },
            callback: function (value: unknown) {
              return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(Number(value));
            },
          },
        },
      },
    };
  }

  createPieChartData(
    labels: string[],
    data: number[],
    isDark = false
  ): ChartData<'doughnut'> {
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: this.generateColors(data.length, isDark),
          borderColor: isDark ? '#1f2937' : '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }

  createBarChartData(
    labels: string[],
    datasets: ChartDataset[],
    isDark = false
  ): ChartData<'bar'> {
    return {
      labels,
      datasets: datasets.map((dataset) => ({
        ...dataset,
        backgroundColor:
          dataset.backgroundColor || this.generateColors(1, isDark)[0],
        borderColor: dataset.borderColor || this.generateColors(1, isDark)[0],
        borderWidth: dataset.borderWidth || 1,
      })),
    };
  }

  createLineChartData(
    labels: string[],
    datasets: ChartDataset[],
    isDark = false
  ): ChartData<'line'> {
    return {
      labels,
      datasets: datasets.map((dataset) => ({
        ...dataset,
        backgroundColor:
          dataset.backgroundColor || this.generateColors(1, isDark)[0] + '20',
        borderColor: dataset.borderColor || this.generateColors(1, isDark)[0],
        borderWidth: dataset.borderWidth || 2,
        tension: dataset.tension || 0.4,
        fill: dataset.fill || false,
      })),
    };
  }

  createMonthlyComparisonData(
    labels: string[],
    incomeData: number[],
    expenseData: number[],
    isDark = false
  ): ChartData<'bar'> {
    const colors = this.generateColors(2, isDark);
    return {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          backgroundColor: colors[0] + '80',
          borderColor: colors[0],
          borderWidth: 1,
        },
        {
          label: 'Gastos',
          data: expenseData,
          backgroundColor: colors[1] + '80',
          borderColor: colors[1],
          borderWidth: 1,
        },
      ],
    };
  }

  createExpensesByCategoryData(
    data: { name: string; amount: number; percentage: number }[]
  ): ChartData<'doughnut'> {
    return {
      labels: data.map((item) => item.name),
      datasets: [
        {
          data: data.map((item) => item.amount),
          backgroundColor: this.generateColors(data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }

  getPieChartConfig(title: string): ChartConfigOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
        },
        legend: {
          display: true,
          position: 'bottom',
        },
        tooltip: {
          enabled: true,
        },
      },
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  getColor(index: number): string {
    return this.colors[index % this.colors.length];
  }

  getIncomeColor(): string {
    return '#10B981'; // Verde para ingresos
  }

  getExpenseColor(): string {
    return '#EF4444'; // Rojo para gastos
  }

  getBarChartConfig(title: string): ChartConfigOptions {
    return {
      ...this.getBarChartOptions(),
      plugins: {
        ...this.getBarChartOptions().plugins,
        title: {
          display: !!title,
          text: title,
        },
      },
    };
  }

  getLineChartConfig(title: string): ChartConfigOptions {
    return {
      ...this.getLineChartOptions(),
      plugins: {
        ...this.getLineChartOptions().plugins,
        title: {
          display: !!title,
          text: title,
        },
      },
    };
  }

  getBalanceColor(): string {
    return '#6366F1'; // Azul para balance
  }
}
