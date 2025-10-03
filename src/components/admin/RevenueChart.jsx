import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

const RevenueChart = ({ data }) => {
    const [chartColors, setChartColors] = useState(null);

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        
        const colors = {
            primary: rootStyles.getPropertyValue('--primary').trim().replace(/ /g, ','),
            info: rootStyles.getPropertyValue('--info').trim().replace(/ /g, ','),
            background: rootStyles.getPropertyValue('--background').trim().replace(/ /g, ','),
            foreground: rootStyles.getPropertyValue('--foreground').trim().replace(/ /g, ','),
            border: rootStyles.getPropertyValue('--border').trim().replace(/ /g, ','),
            mutedForeground: rootStyles.getPropertyValue('--muted-foreground').trim().replace(/ /g, ','),
        };

        setChartColors(colors);
    }, []);

    const getOption = () => {
        if (!chartColors) return {};

        const dates = data.map(item => new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
        const revenues = data.map(item => item.revenue.toFixed(2));
        const subscribers = data.map(item => item.subscriberCount);

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: `hsl(${chartColors.background})`,
                borderColor: `hsl(${chartColors.border})`,
                textStyle: {
                    color: `hsl(${chartColors.foreground})`
                },
                formatter: function (params) {
                    const date = new Date(data[params[0].dataIndex].date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    let tooltip = `${date}<br />`;
                    params.forEach(param => {
                        if (param.seriesName === "Chiffre d'affaires") {
                            tooltip += `${param.marker} ${param.seriesName} : <strong>€${parseFloat(param.value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><br />`;
                        } else {
                            tooltip += `${param.marker} ${param.seriesName} : <strong>${parseInt(param.value).toLocaleString('fr-FR')}</strong><br />`;
                        }
                    });
                    return tooltip;
                }
            },
            legend: {
                data: ["Chiffre d'affaires", "Nombre d'abonnés"],
                textStyle: {
                    color: `hsl(${chartColors.mutedForeground})`
                },
                bottom: 0,
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: dates,
                axisLine: {
                    lineStyle: {
                        color: `hsl(${chartColors.mutedForeground})`
                    }
                },
                axisLabel: {
                    color: `hsl(${chartColors.mutedForeground})`
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: "Chiffre d'affaires",
                    position: 'left',
                    axisLabel: {
                        formatter: '€{value}',
                        color: `hsl(${chartColors.mutedForeground})`
                    },
                    splitLine: {
                        lineStyle: {
                            color: `hsl(${chartColors.border})`
                        }
                    },
                    nameTextStyle: {
                        color: `hsl(${chartColors.mutedForeground})`
                    }
                },
                {
                    type: 'value',
                    name: 'Abonnés',
                    position: 'right',
                    axisLabel: {
                        formatter: '{value}',
                        color: `hsl(${chartColors.mutedForeground})`
                    },
                    splitLine: { show: false },
                    nameTextStyle: {
                        color: `hsl(${chartColors.mutedForeground})`
                    }
                }
            ],
            series: [
                {
                    name: "Chiffre d'affaires",
                    type: 'line',
                    yAxisIndex: 0,
                    smooth: true,
                    data: revenues,
                    itemStyle: {
                        color: `hsl(${chartColors.primary})`
                    },
                    lineStyle: {
                        width: 2,
                        color: `hsl(${chartColors.primary})`
                    },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: `hsla(${chartColors.primary}, 0.3)` }, { offset: 1, color: `hsla(${chartColors.primary}, 0)` }]
                        }
                    },
                    showSymbol: false,
                },
                {
                    name: "Nombre d'abonnés",
                    type: 'line',
                    yAxisIndex: 1,
                    smooth: true,
                    data: subscribers,
                    itemStyle: {
                        color: `hsl(${chartColors.info})`
                    },
                    lineStyle: {
                        width: 2,
                        color: `hsl(${chartColors.info})`
                    },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: `hsla(${chartColors.info}, 0.3)` }, { offset: 1, color: `hsla(${chartColors.info}, 0)` }]
                        }
                    },
                    showSymbol: false,
                }
            ],
            dataZoom: [{
                type: 'inside',
                start: 0,
                end: 100
            }],
            backgroundColor: 'transparent',
        };
    };

    if (!chartColors) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">Chargement du graphique...</div>;
    }

    return (
        <ReactECharts
            option={getOption()}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
            theme={"dark"}
        />
    );
};

export default RevenueChart;
