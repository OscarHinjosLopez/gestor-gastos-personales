import { Injectable } from '@angular/core';
import { PeriodComparison } from '../models/period-comparison.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Export comparison data to CSV format
   */
  exportComparisonToCSV(comparison: PeriodComparison): void {
    const csvContent = this.generateCSVContent(comparison);
    this.downloadFile(csvContent, 'comparacion-periodos.csv', 'text/csv');
  }

  /**
   * Copy comparison summary to clipboard
   */
  async copyComparisonToClipboard(
    comparison: PeriodComparison
  ): Promise<boolean> {
    try {
      const textContent = this.generateTextSummary(comparison);
      await navigator.clipboard.writeText(textContent);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Export comparison data to PDF (simplified text-based version)
   */
  exportComparisonToPDF(comparison: PeriodComparison): void {
    // For a simple implementation, we'll create a text-based "PDF"
    // In a production app, you'd use a library like jsPDF
    const content = this.generatePDFContent(comparison);
    this.downloadFile(content, 'comparacion-periodos.txt', 'text/plain');
  }

  private generateCSVContent(comparison: PeriodComparison): string {
    const lines: string[] = [];

    // Header
    lines.push('Comparación de Períodos - Resumen Financiero');
    lines.push('');

    // Period information
    lines.push('Información de Períodos');
    lines.push('Período,Fecha Inicio,Fecha Fin,Label');
    lines.push(
      `Período 1,${comparison.period1.range.start},${
        comparison.period1.range.end
      },${comparison.period1.range.label || 'Período 1'}`
    );
    lines.push(
      `Período 2,${comparison.period2.range.start},${
        comparison.period2.range.end
      },${comparison.period2.range.label || 'Período 2'}`
    );
    lines.push('');

    // Main metrics
    lines.push('Métricas Principales');
    lines.push('Métrica,Período 1,Período 2,Diferencia,Cambio %');
    lines.push(
      `Balance,${comparison.period1.data.balance.toFixed(
        2
      )},${comparison.period2.data.balance.toFixed(
        2
      )},${comparison.metrics.balanceDelta.absolute.toFixed(
        2
      )},${comparison.metrics.balanceDelta.percentage.toFixed(1)}%`
    );
    lines.push(
      `Ingresos,${comparison.period1.data.totalIncomes.toFixed(
        2
      )},${comparison.period2.data.totalIncomes.toFixed(
        2
      )},${comparison.metrics.incomeDelta.absolute.toFixed(
        2
      )},${comparison.metrics.incomeDelta.percentage.toFixed(1)}%`
    );
    lines.push(
      `Gastos,${comparison.period1.data.totalExpenses.toFixed(
        2
      )},${comparison.period2.data.totalExpenses.toFixed(
        2
      )},${comparison.metrics.expenseDelta.absolute.toFixed(
        2
      )},${comparison.metrics.expenseDelta.percentage.toFixed(1)}%`
    );
    lines.push(
      `Tasa de Ahorro,${comparison.period1.data.savingsRate.toFixed(
        1
      )}%,${comparison.period2.data.savingsRate.toFixed(
        1
      )}%,${comparison.metrics.savingsRateDelta.absolute.toFixed(
        1
      )},${comparison.metrics.savingsRateDelta.percentage.toFixed(1)}%`
    );
    lines.push('');

    // Category breakdown
    lines.push('Cambios por Categoría');
    lines.push('Categoría,Período 1,Período 2,Diferencia,Cambio %,Estado');
    comparison.metrics.categoryChanges.forEach((change) => {
      const status = change.isNew
        ? 'Nueva'
        : change.isRemoved
        ? 'Eliminada'
        : 'Existente';
      lines.push(
        `${change.name},${change.period1Amount.toFixed(
          2
        )},${change.period2Amount.toFixed(2)},${change.delta.absolute.toFixed(
          2
        )},${change.delta.percentage.toFixed(1)}%,${status}`
      );
    });
    lines.push('');

    // Source breakdown
    lines.push('Cambios por Fuente de Ingresos');
    lines.push('Fuente,Período 1,Período 2,Diferencia,Cambio %,Estado');
    comparison.metrics.sourceChanges.forEach((change) => {
      const status = change.isNew
        ? 'Nueva'
        : change.isRemoved
        ? 'Eliminada'
        : 'Existente';
      lines.push(
        `${change.name},${change.period1Amount.toFixed(
          2
        )},${change.period2Amount.toFixed(2)},${change.delta.absolute.toFixed(
          2
        )},${change.delta.percentage.toFixed(1)}%,${status}`
      );
    });
    lines.push('');

    // Insights
    lines.push('Insights Automáticos');
    lines.push('Tipo,Categoría,Título,Descripción,Prioridad');
    comparison.insights.forEach((insight) => {
      lines.push(
        `${insight.type},${insight.category},${insight.title},"${insight.description}",${insight.priority}`
      );
    });

    return lines.join('\n');
  }

  private generateTextSummary(comparison: PeriodComparison): string {
    const lines: string[] = [];

    lines.push('📊 COMPARACIÓN DE PERÍODOS');
    lines.push('='.repeat(50));
    lines.push('');

    lines.push(
      `📅 ${comparison.period1.range.label || 'Período 1'} vs ${
        comparison.period2.range.label || 'Período 2'
      }`
    );
    lines.push(
      `🗓️ ${comparison.period1.range.start} - ${comparison.period1.range.end} vs ${comparison.period2.range.start} - ${comparison.period2.range.end}`
    );
    lines.push('');

    lines.push('💰 MÉTRICAS PRINCIPALES:');
    lines.push(
      `Balance: ${this.formatCurrency(
        comparison.period1.data.balance
      )} → ${this.formatCurrency(comparison.period2.data.balance)} (${
        comparison.metrics.balanceDelta.percentage > 0 ? '+' : ''
      }${comparison.metrics.balanceDelta.percentage.toFixed(1)}%)`
    );
    lines.push(
      `Ingresos: ${this.formatCurrency(
        comparison.period1.data.totalIncomes
      )} → ${this.formatCurrency(comparison.period2.data.totalIncomes)} (${
        comparison.metrics.incomeDelta.percentage > 0 ? '+' : ''
      }${comparison.metrics.incomeDelta.percentage.toFixed(1)}%)`
    );
    lines.push(
      `Gastos: ${this.formatCurrency(
        comparison.period1.data.totalExpenses
      )} → ${this.formatCurrency(comparison.period2.data.totalExpenses)} (${
        comparison.metrics.expenseDelta.percentage > 0 ? '+' : ''
      }${comparison.metrics.expenseDelta.percentage.toFixed(1)}%)`
    );
    lines.push(
      `Tasa de Ahorro: ${comparison.period1.data.savingsRate.toFixed(
        1
      )}% → ${comparison.period2.data.savingsRate.toFixed(1)}%`
    );
    lines.push('');

    if (comparison.insights.length > 0) {
      lines.push('💡 INSIGHTS PRINCIPALES:');
      comparison.insights.slice(0, 3).forEach((insight, index) => {
        lines.push(`${index + 1}. ${insight.title}: ${insight.description}`);
      });
      lines.push('');
    }

    lines.push('🏷️ TOP CAMBIOS POR CATEGORÍA:');
    comparison.metrics.categoryChanges.slice(0, 5).forEach((change, index) => {
      const arrow =
        change.delta.percentage > 0
          ? '↗️'
          : change.delta.percentage < 0
          ? '↘️'
          : '➡️';
      lines.push(
        `${index + 1}. ${change.name}: ${this.formatCurrency(
          change.period1Amount
        )} → ${this.formatCurrency(
          change.period2Amount
        )} ${arrow} ${change.delta.percentage.toFixed(1)}%`
      );
    });

    lines.push('');
    lines.push('📱 Generado por Gestor de Gastos Personales');
    lines.push(
      `📅 ${new Date().toLocaleDateString(
        'es-ES'
      )} ${new Date().toLocaleTimeString('es-ES')}`
    );

    return lines.join('\n');
  }

  private generatePDFContent(comparison: PeriodComparison): string {
    const lines: string[] = [];

    lines.push('COMPARACIÓN DE PERÍODOS - INFORME DETALLADO');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push('INFORMACIÓN GENERAL:');
    lines.push('-'.repeat(30));
    lines.push(`Período 1: ${comparison.period1.range.label || 'Período 1'}`);
    lines.push(
      `  Fechas: ${comparison.period1.range.start} al ${comparison.period1.range.end}`
    );
    lines.push(`Período 2: ${comparison.period2.range.label || 'Período 2'}`);
    lines.push(
      `  Fechas: ${comparison.period2.range.start} al ${comparison.period2.range.end}`
    );
    lines.push('');

    lines.push('RESUMEN EJECUTIVO:');
    lines.push('-'.repeat(30));
    lines.push(
      `Balance total: ${this.formatCurrency(
        comparison.period1.data.balance
      )} vs ${this.formatCurrency(comparison.period2.data.balance)}`
    );
    lines.push(
      `Cambio en balance: ${
        comparison.metrics.balanceDelta.percentage > 0 ? '+' : ''
      }${comparison.metrics.balanceDelta.percentage.toFixed(
        1
      )}% (${this.formatCurrency(comparison.metrics.balanceDelta.absolute)})`
    );
    lines.push('');
    lines.push(
      `Total ingresos: ${this.formatCurrency(
        comparison.period1.data.totalIncomes
      )} vs ${this.formatCurrency(comparison.period2.data.totalIncomes)}`
    );
    lines.push(
      `Cambio en ingresos: ${
        comparison.metrics.incomeDelta.percentage > 0 ? '+' : ''
      }${comparison.metrics.incomeDelta.percentage.toFixed(1)}%`
    );
    lines.push('');
    lines.push(
      `Total gastos: ${this.formatCurrency(
        comparison.period1.data.totalExpenses
      )} vs ${this.formatCurrency(comparison.period2.data.totalExpenses)}`
    );
    lines.push(
      `Cambio en gastos: ${
        comparison.metrics.expenseDelta.percentage > 0 ? '+' : ''
      }${comparison.metrics.expenseDelta.percentage.toFixed(1)}%`
    );
    lines.push('');

    lines.push('ANÁLISIS DETALLADO:');
    lines.push('-'.repeat(30));
    lines.push('');

    lines.push('Cambios por categoría de gastos:');
    comparison.metrics.categoryChanges.forEach((change, index) => {
      if (index < 10) {
        // Limit to top 10
        lines.push(`  ${index + 1}. ${change.name}:`);
        lines.push(
          `     ${this.formatCurrency(
            change.period1Amount
          )} → ${this.formatCurrency(change.period2Amount)} (${
            change.delta.percentage > 0 ? '+' : ''
          }${change.delta.percentage.toFixed(1)}%)`
        );
        if (change.isNew) lines.push('     [NUEVA CATEGORÍA]');
        if (change.isRemoved) lines.push('     [CATEGORÍA ELIMINADA]');
      }
    });
    lines.push('');

    lines.push('Cambios por fuente de ingresos:');
    comparison.metrics.sourceChanges.forEach((change, index) => {
      if (index < 10) {
        // Limit to top 10
        lines.push(`  ${index + 1}. ${change.name}:`);
        lines.push(
          `     ${this.formatCurrency(
            change.period1Amount
          )} → ${this.formatCurrency(change.period2Amount)} (${
            change.delta.percentage > 0 ? '+' : ''
          }${change.delta.percentage.toFixed(1)}%)`
        );
        if (change.isNew) lines.push('     [NUEVA FUENTE]');
        if (change.isRemoved) lines.push('     [FUENTE ELIMINADA]');
      }
    });
    lines.push('');

    if (comparison.insights.length > 0) {
      lines.push('INSIGHTS Y RECOMENDACIONES:');
      lines.push('-'.repeat(30));
      comparison.insights.forEach((insight, index) => {
        lines.push(
          `${index + 1}. [${insight.priority.toUpperCase()}] ${insight.title}`
        );
        lines.push(`   ${insight.description}`);
        lines.push('');
      });
    }

    lines.push('INFORMACIÓN DEL INFORME:');
    lines.push('-'.repeat(30));
    lines.push(
      `Generado: ${new Date().toLocaleDateString(
        'es-ES'
      )} a las ${new Date().toLocaleTimeString('es-ES')}`
    );
    lines.push('Aplicación: Gestor de Gastos Personales');
    lines.push('');
    lines.push(
      'Este informe contiene datos financieros sensibles. Manténgalo seguro.'
    );

    return lines.join('\n');
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }
}
