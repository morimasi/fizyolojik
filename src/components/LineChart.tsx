/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { PainJournalEntry } from '../types';

interface LineChartProps {
  data: PainJournalEntry[];
  title: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, title }) => {
  const width = 500;
  const height = 300;
  const margin = { top: 40, right: 20, bottom: 50, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (data.length < 2) {
    return (
      <div className="chart-container" style={{ width, height }}>
        <h4>{title}</h4>
        <div className="chart-placeholder">
          <p>Grafiği görüntülemek için en az 2 günlük veri gereklidir.</p>
        </div>
      </div>
    );
  }
  
  const minDate = data[0].date;
  const maxDate = data[data.length - 1].date;

  const getPath = () => {
    const xScale = (date: number) => 
        ((date - minDate) / (maxDate - minDate)) * innerWidth;
    const yScale = (level: number) => 
        innerHeight - ((level - 1) / 9) * innerHeight;

    let path = `M ${xScale(data[0].date)} ${yScale(data[0].painLevel)}`;
    data.slice(1).forEach(point => {
        path += ` L ${xScale(point.date)} ${yScale(point.painLevel)}`;
    });
    return path;
  };
  
  const yAxisLabels = Array.from({ length: 10 }, (_, i) => 10 - i);
  const xAxisLabels = data.map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }));

  return (
    <div className="chart-container">
      <h4>{title}</h4>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Y Axis Grid Lines & Labels */}
          {yAxisLabels.map(label => {
            const y = innerHeight - ((label - 1) / 9) * innerHeight;
            return (
              <g key={label} className="axis-grid">
                <line x1={0} y1={y} x2={innerWidth} y2={y} />
                <text x={-10} y={y + 4} className="axis-label">{label}</text>
              </g>
            );
          })}
          <text className="axis-title y-axis-title" transform={`rotate(-90)`} y={-margin.left + 15} x={-innerHeight / 2}>Ağrı Seviyesi</text>

          {/* X Axis Grid Lines & Labels */}
          {data.map((point, index) => {
              const x = ((point.date - minDate) / (maxDate - minDate)) * innerWidth;
              return(
                  <text key={index} x={x} y={innerHeight + 20} className="axis-label x-axis-label">{xAxisLabels[index]}</text>
              )
          })}
           <text className="axis-title" x={innerWidth / 2} y={innerHeight + 40}>Tarih</text>


          {/* Line Path */}
          <path d={getPath()} className="chart-line" />

          {/* Data Points */}
          {data.map((point, index) => {
            const cx = ((point.date - minDate) / (maxDate - minDate)) * innerWidth;
            const cy = innerHeight - ((point.painLevel - 1) / 9) * innerHeight;
            return (
                <circle key={index} cx={cx} cy={cy} r="4" className="chart-point">
                    <title>{`Tarih: ${xAxisLabels[index]}\nAğrı: ${point.painLevel}\nNot: ${point.note}`}</title>
                </circle>
            )
          })}
        </g>
      </svg>
    </div>
  );
};

export default LineChart;