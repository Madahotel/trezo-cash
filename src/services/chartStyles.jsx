const formatCurrency = (value, options = {}) => {
    const {
        currency = 'EUR',
        compact = false,
        showSymbol = true,
        precision = 2
    } = options;

    const symbol = currency === 'EUR' ? '€' : currency;

    if (value == null || isNaN(Number(value))) {
        return showSymbol ? `${symbol}0.00` : '0.00';
    }

    const numValue = parseFloat(value);

    if (compact) {
        const absValue = Math.abs(numValue);
        if (absValue >= 1_000_000) {
            return `${symbol}${(numValue / 1_000_000).toFixed(1)}M`;
        }
        if (absValue >= 1_000) {
            return `${symbol}${(numValue / 1_000).toFixed(1)}k`;
        }
    }

    const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    }).format(numValue);

    return showSymbol ? `${symbol}${formatted}` : formatted;
};

export const chartStyles = {
    colors: {
        budget: '#3b82f6',
        actual: '#10b981',
        budgetExpense: '#ef4444',
        actualExpense: '#f97316',
        budgetRevenue: '#3b82f6',
        actualRevenue: '#10b981',
        neutralGray: '#6b7280',
        lightGray: '#9ca3af',
    },

    font: {
        family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        size: {
            mobile: {
                title: 14,
                axis: 10,
                label: 11,
                legend: 12,
            },
            desktop: {
                title: 16,
                axis: 12,
                label: 12,
                legend: 13,
            },
        },
    },

    getChartOptionsForAnalyseView: (config) => {
        const {
            analysisMode,
            categoryAnalysisData,
            tierAnalysisData,
            analysisType,
            analysisPeriodName,
            settings = { currency: 'EUR' },
            visibleData = { budget: true, actual: true },
            isMobile = false,
        } = config;

        let categories = [];
        let budgetData = [];
        let actualData = [];

        const sourceData = analysisMode === 'tier'
            ? tierAnalysisData?.tiers
            : categoryAnalysisData?.categories;

        if (sourceData?.length > 0) {
            categories = sourceData.map(item => {
                if (typeof item === 'string') {
                    return { name: item, count: 0 };
                }
                return {
                    name: item.name || 'Sans nom',
                    count: item.count || 0,
                };
            });

            if (typeof sourceData[0] !== 'string') {
                budgetData = sourceData.map(item => parseFloat(item.budget || 0));
                actualData = sourceData.map(item => parseFloat(item.actual || 0));
            } else {
                budgetData = analysisMode === 'tier'
                    ? tierAnalysisData.budgetData || []
                    : categoryAnalysisData.budgetData || [];
                actualData = analysisMode === 'tier'
                    ? tierAnalysisData.actualData || []
                    : categoryAnalysisData.actualData || [];
            }
        }

        if (categories.length === 0) {
            return chartStyles.getEmptyChartOptions('Aucune donnée disponible');
        }

        const titleText = `${analysisMode === 'tier' ? 'Analyse par tiers' : 'Analyse par catégorie'} - ${analysisPeriodName}`;

        return chartStyles.getBaseChartOptions({
            titleText,
            categories,
            budgetData,
            actualData,
            visibleData,
            settings,
            isMobile,
            analysisType,
        });
    },

    getChartOptionsForConsolidatedView: (config) => {
        const {
            processedData,
            analysisMode,
            analysisType,
            analysisPeriodName,
            visibleData = { budget: true, actual: true },
            isMobile = false,
        } = config;

        if (!processedData || processedData.categories.length === 0) {
            return chartStyles.getEmptyChartOptions('Aucune donnée disponible');
        }

        const categories = processedData.categories.map(item => ({
            name: item.name,
            count: item.count || 0,
        }));
        const budgetData = processedData.categories.map(item => parseFloat(item.budget || 0));
        const actualData = processedData.categories.map(item => parseFloat(item.actual || 0));

        const modeText = analysisMode === 'project' ? 'par projet' :
            analysisMode === 'tier' ? 'par tiers' : 'par catégorie';

        const titleText = `Analyse consolidée ${modeText} - ${analysisPeriodName}`;

        return chartStyles.getBaseChartOptions({
            titleText,
            categories,
            budgetData,
            actualData,
            visibleData,
            settings: { currency: 'EUR' },
            isMobile,
            analysisType,
        });
    },

    getBaseChartOptions: (config) => {
        const {
            titleText = '',
            categories = [],
            budgetData = [],
            actualData = [],
            visibleData = { budget: true, actual: true },
            settings = { currency: 'EUR' },
            isMobile = false,
            analysisType = 'all',
            showLegend = true,
            barWidth = '60%',
            grid = {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '15%',
                containLabel: true,
            },
        } = config;

        const fontSize = isMobile ? chartStyles.font.size.mobile : chartStyles.font.size.desktop;

        const getSeriesColors = () => {
            if (analysisType === 'expense') {
                return {
                    budget: chartStyles.colors.budgetExpense,
                    actual: chartStyles.colors.actualExpense,
                };
            } else if (analysisType === 'revenue') {
                return {
                    budget: chartStyles.colors.budgetRevenue,
                    actual: chartStyles.colors.actualRevenue,
                };
            }
            return {
                budget: chartStyles.colors.budget,
                actual: chartStyles.colors.actual,
            };
        };

        const seriesColors = getSeriesColors();

        const series = [];

        if (visibleData.budget) {
            series.push({
                name: 'Budget',
                type: 'bar',
                data: budgetData,
                itemStyle: {
                    color: seriesColors.budget,
                    borderRadius: [0, 4, 4, 0],
                },
                barWidth: barWidth,
                label: {
                    show: true,
                    position: 'right',
                    fontSize: fontSize.label,
                    fontWeight: '600',
                    formatter: function (params) {
                        return formatCurrency(params.value, {
                            currency: settings.currency,
                            compact: true
                        });
                    },
                    color: '#1f2937',
                },
                emphasis: {
                    itemStyle: {
                        shadowColor: 'rgba(0, 0, 0, 0.3)',
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                    }
                },
            });
        }

        if (visibleData.actual) {
            series.push({
                name: 'Réel',
                type: 'bar',
                data: actualData,
                itemStyle: {
                    color: seriesColors.actual,
                    borderRadius: [0, 4, 4, 0],
                },
                barWidth: barWidth,
                label: {
                    show: true,
                    position: 'right',
                    fontSize: fontSize.label,
                    fontWeight: '600',
                    formatter: function (params) {
                        return formatCurrency(params.value, {
                            currency: settings.currency,
                            compact: true
                        });
                    },
                    color: '#1f2937',
                },
                emphasis: {
                    itemStyle: {
                        shadowColor: 'rgba(0, 0, 0, 0.3)',
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                    }
                },
            });
        }

        return {
            title: {
                text: titleText,
                left: 'center',
                textStyle: {
                    fontSize: fontSize.title,
                    fontWeight: 'bold',
                    color: '#111827',
                },
                padding: [10, 0, 20, 0],
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                    shadowStyle: {
                        color: 'rgba(150, 150, 150, 0.1)',
                    },
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                textStyle: {
                    color: '#374151',
                    fontSize: fontSize.label,
                },
                padding: [12, 16],
                borderRadius: 8,
                formatter: function (params) {
                    const dataIndex = params[0].dataIndex;
                    const item = categories[dataIndex] || {};
                    const label = item.name || item || "N/A";

                    let result = `<div style="margin-bottom: 8px; font-weight: 600; color: #111827;">${label}</div>`;

                    params.forEach(param => {
                        const value = formatCurrency(param.value, {
                            currency: settings.currency
                        });
                        const seriesName = param.seriesName;
                        const color = param.color;

                        result += `
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 2px; margin-right: 8px;"></span>
                <span style="color: #4b5563;">${seriesName}:</span>
                <span style="font-weight: 600; color: #111827; margin-left: auto;">${value}</span>
              </div>
            `;
                    });

                    if (item.count) {
                        result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">${item.count} budgets</div>`;
                    }

                    return result;
                },
            },
            legend: showLegend ? {
                data: ['Budget', 'Réel'].filter((_, index) =>
                    (index === 0 && visibleData.budget) || (index === 1 && visibleData.actual)
                ),
                bottom: 0,
                textStyle: {
                    fontSize: fontSize.legend,
                    color: '#4b5563',
                },
                itemWidth: 16,
                itemHeight: 8,
                itemGap: 20,
                borderRadius: 4,
            } : undefined,
            grid: {
                ...grid,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
            },
            xAxis: {
                type: 'value',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#d1d5db',
                    },
                },
                axisTick: {
                    show: false,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#f3f4f6',
                        type: 'dashed',
                    },
                },
                axisLabel: {
                    fontSize: fontSize.axis,
                    color: '#6b7280',
                    fontWeight: '500',
                    formatter: function (value) {
                        return formatCurrency(value, {
                            currency: settings.currency,
                            compact: true
                        });
                    },
                },
            },
            yAxis: {
                type: 'category',
                data: categories.map(item => item.name || item),
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    fontSize: fontSize.axis,
                    color: '#374151',
                    fontWeight: '500',
                    padding: [0, 8, 0, 0],
                    formatter: function (value) {
                        if (isMobile && value.length > 20) {
                            return value.substring(0, 17) + '...';
                        }
                        return value;
                    },
                },
                splitLine: {
                    show: false,
                },
            },
            series: series,
            animation: true,
            animationDuration: 500,
            animationEasing: 'cubicOut',
        };
    },

    getEmptyChartOptions: (title = 'Aucune donnée disponible') => {
        return {
            title: {
                text: title,
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#9ca3af',
                    fontSize: 14,
                    fontWeight: 'normal',
                },
            },
            graphic: {
                type: 'text',
                left: 'center',
                top: '45%',
                style: {
                    text: 'Aucune donnée à afficher pour cette période',
                    fontSize: 12,
                    fill: '#9ca3af',
                },
            },
        };
    },

    generateAnalysisChart: (config = {}) => {
        const {
            analysisMode,
            data,
            analysisType = 'all',
            periodName = 'Période non spécifiée',
            currency = 'EUR',
            visibleSeries = { budget: true, actual: true },
            isMobile = false,
            title = null,
        } = config;

        return chartStyles.getChartOptionsForAnalyseView({
            analysisMode,
            categoryAnalysisData: analysisMode === 'category' ? data : undefined,
            tierAnalysisData: analysisMode === 'tier' ? data : undefined,
            analysisType,
            analysisPeriodName: periodName,
            settings: { currency },
            visibleData: visibleSeries,
            isMobile,
        });
    },

    generateEmptyState: (config = {}) => {
        const {
            title = 'Aucune donnée disponible',
            message = 'Aucune donnée à afficher pour cette période',
            isMobile = false,
            showAction = false,
        } = config || {};

        return chartStyles.getEmptyChartOptions(title);
    },

    generateChart: (config = {}) => {
        return chartStyles.getBaseChartOptions(config);
    },

    calculateChartHeight: (dataLength, isMobile = false) => {
        const baseHeight = isMobile ? 350 : 400;
        if (!dataLength) return baseHeight;
        return Math.max(baseHeight, dataLength * 70);
    },

    processChartData: (mode, data, maxCategories = 15) => {
        const sourceData = mode === 'tier'
            ? data?.tiers
            : data?.categories;

        if (!sourceData?.length) {
            return { categories: [], budgetData: [], actualData: [] };
        }

        const categories = sourceData.map(item => ({
            name: typeof item === 'string' ? item : (item.name || 'Sans nom'),
            count: typeof item === 'string' ? 0 : (item.count || 0),
        }));

        const budgetData = sourceData.map(item =>
            typeof item === 'string' ? 0 : parseFloat(item.budget || 0)
        );

        const actualData = sourceData.map(item =>
            typeof item === 'string' ? 0 : parseFloat(item.actual || 0)
        );

        return { categories, budgetData, actualData };
    },

    calculateVariance: (actual, budget) => {
        if (!budget || budget === 0) return { value: 0, percent: 0 };

        const value = actual - budget;
        const percent = (value / Math.abs(budget)) * 100;

        return {
            value,
            percent: Math.round(percent * 10) / 10,
        };
    },
};

export const chartConfig = chartStyles;

export const chartDesignSystem = {
    palette: {
        primary: {
            budget: '#2563eb',
            actual: '#059669',
            budgetExpense: '#dc2626',
            actualExpense: '#ea580c',
            budgetRevenue: '#1d4ed8',
            actualRevenue: '#047857',
        },
        semantic: {
            positive: '#10b981',
            warning: '#f59e0b',
            negative: '#ef4444',
        },
        neutral: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
        }
    },
    typography: chartStyles.font,
};