// List view JS for enhanced functionality
frappe.listview_settings['Broiler Daily Transaction'] = {
    onload: function (listview) {
        // Set default filter to show transactions from the past week
        frappe.route_options = {
            'transaction_date': ['>=', frappe.datetime.add_days(frappe.datetime.get_today(), -7)]
        };

        // Add custom filter button for critical batches
        listview.page.add_inner_button(__('Show Critical Batches'), function () {
            // Clear existing filters first to prevent stacking
            listview.filter_area.clear();

            // Add combined filter for critical conditions
            listview.filter_area.add([
                ['Broiler Daily Transaction', 'mortality_variance', '>', '0', true],
                ['OR'],
                ['Broiler Daily Transaction', 'feed_consumption_variance_percentage', '>', '5', true]
            ]);
        });

        // Add batch performance report button
        this.addBatchPerformanceReportButton(listview);
    },

    refresh: function (listview) {
        // Re-add the report button on refresh to ensure it's always available
        this.addBatchPerformanceReportButton(listview);
    },

    // Helper method to add batch performance report button
    // addBatchPerformanceReportButton: function (listview) {
    //     // Check if button already exists to avoid duplicates
    //     if (!listview.page.menu.has_item(__('Generate Batch Performance Report'))) {
    //         listview.page.add_menu_item(__('Generate Batch Performance Report'), function () {
    //             frappe.set_route('query-report', 'Broiler Batch Performance');
    //         });
    //     }
    // },

    addBatchPerformanceReportButton: function (listview) {
        // Check if button already exists to avoid duplicates
        if (!$(`.menu-item:contains("Generate Batch Performance Report")`).length) {
            listview.page.add_menu_item(__('Generate Batch Performance Report'), function () {
                frappe.set_route('query-report', 'Broiler Batch Performance');
            });
        }
    },
    

    // Add status indicators for transactions
    get_indicator: function (doc) {
        // Using more descriptive variable names
        const highMortality = doc.mortality_variance > 0;
        const highFeedVariance = doc.feed_consumption_variance_percentage > 5;
        const underweight = doc.weight_variance_percentage < -5;

        // Prioritized status indicators
        if (highMortality && highFeedVariance) {
            return [__("Critical"), "red", "mortality_variance,>,0|feed_consumption_variance_percentage,>,5"];
        } else if (highMortality) {
            return [__("High Mortality"), "orange", "mortality_variance,>,0"];
        } else if (highFeedVariance) {
            return [__("High Feed Variance"), "yellow", "feed_consumption_variance_percentage,>,5"];
        } else if (underweight) {
            return [__("Underweight"), "blue", "weight_variance_percentage,<,-5"];
        } else {
            return [__("Normal"), "green", "mortality_variance,<=,0|feed_consumption_variance_percentage,<=,5"];
        }
    },

    // Custom column formatters
    formatters: {
        // Link formatter for batch field
        batch: function (value, df, doc) {
            if (!value) return '';
            return `<a href="/app/broiler-batch/${encodeURIComponent(value)}" 
                      data-doctype="Broiler Batch" 
                      data-name="${encodeURIComponent(value)}">${frappe.utils.escape_html(value)}</a>`;
        },

        // Color formatter for weight variance
        weight_variance: function (value, df, doc) {
            if (!value && value !== 0) return '';

            // Format with appropriate color
            if (value > 0) {
                return `<span style="color: green">+${value.toFixed(2)}</span>`;
            } else if (value < 0) {
                return `<span style="color: red">${value.toFixed(2)}</span>`;
            }
            return value.toFixed(2);
        },

        // Format for FCR with precision
        fcr: function (value, df, doc) {
            if (!value && value !== 0) return '';
            return value.toFixed(3);
        },

        // Format for EEF with precision
        eef: function (value, df, doc) {
            if (!value && value !== 0) return '';
            return value.toFixed(2);
        },

        // Format for variance percentages
        weight_variance_percentage: function (value, df, doc) {
            if (!value && value !== 0) return '';

            const formattedValue = value.toFixed(2) + '%';
            if (value < -5) {
                return `<span style="color: red">${formattedValue}</span>`;
            } else if (value > 5) {
                return `<span style="color: green">${formattedValue}</span>`;
            }
            return formattedValue;
        },

        // Format for feed consumption variance percentage
        feed_consumption_variance_percentage: function (value, df, doc) {
            if (!value && value !== 0) return '';

            const formattedValue = value.toFixed(2) + '%';
            if (value > 5) {
                return `<span style="color: red">${formattedValue}</span>`;
            } else if (value < 0) {
                return `<span style="color: green">${formattedValue}</span>`;
            }
            return formattedValue;
        }
    }
};