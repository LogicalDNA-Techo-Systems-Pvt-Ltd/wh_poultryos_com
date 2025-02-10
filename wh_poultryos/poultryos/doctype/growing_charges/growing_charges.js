// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Growing Charges", {

    setup: function (frm) {
        // First, fetch the ID of "Contract" from Batch Type
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Batch Type", // Fetch all batch types
                fields: ["name", "batch_type"] // Get Name and ID
            },
            callback: function (response) {
                if (response.message && response.message.length > 0) {
                    // Find the ID where the name is "Contract"
                    let contractBatch = response.message.find(bt => bt.batch_type === "Contract");

                    if (contractBatch) {
                        let contract_id = contractBatch.name; // Retrieve the contract ID

                        // Now, set the query for the Batch field using this ID
                        frm.set_query("batch", function () {
                            return {
                                filters: { batch_type: contract_id } // Apply the contract ID filter
                            };
                        });

                        console.log("Contract ID retrieved:", contract_id);
                    } else {
                        frappe.msgprint(__('Contract batch type not found.'));
                    }
                } else {
                    frappe.msgprint(__('Could not find Contract ID in Batch Type.'));
                }
            }
        });
    },

    refresh(frm) {

        frappe.call({
            method: "wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_available_batches",
            callback: function(r) {
                if (r.message) {
                    frm.set_query("batch", function() {
                        return {
                            filters: [["name", "in", r.message.map(b => b.name)]]
                        };
                    });
                }
            }
        });

        frm.add_custom_button("Calculate GC", () => {
            // frappe.show_alert("It works")

            // Retrieve necessary fields from the form
            let totalDeliveredWeight = frm.doc.total_delivered_weight;
            let actualRearingCharges = frm.doc.actual_rearing_chargekg;
            let mortalityIncentive = frm.doc.mortality_incentive || 0;
            let excessBirdIncentive = frm.doc.excess_bird_incentive || 0;
            let fcrIncentive = frm.doc.fcr_incentive || 0;
            let salesIncentive = frm.doc.sales_incentive || 0;

            let totalMortalityDeduction = frm.doc.total_mortality_deduction || 0;
            let fcrDeductions = frm.doc.fcr_deductions || 0;
            let shortageAmount = frm.doc.shortage_amount || 0;

            // Calculate the Rearing Charges Payable
            let rearingChargesPayable = (
                ((totalDeliveredWeight * actualRearingCharges) +
                    (mortalityIncentive + excessBirdIncentive + fcrIncentive + salesIncentive)) -
                (totalMortalityDeduction + fcrDeductions + shortageAmount)
            );

            // Round the result to 2 decimal places
            rearingChargesPayable = Number(rearingChargesPayable.toFixed(2));

            // Bind the calculated value to the `rearing_charges_payable` field
            frm.set_value("net_payable_amount", rearingChargesPayable);

            // Optional: Show a success message
            frappe.msgprint(__('Rearing Charges Payable calculated successfully.'));

        })
    },

    batch: function (frm) {

        if (!frm.doc.batch) {
            frappe.msgprint(__('Please select a batch'));
            return;
        }



        // Fetch the placement date from the Batch doctype
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "CBF Batch",
                name: frm.doc.batch
            },
            callback: function (response) {
                if (response.message) {
                    let placement_date = response.message.opening_date;
                    let live_batch_date = response.message.live_batch_date;

                    const live_batch_quantity = parseFloat(response.message.live_quantity_number_of_birds || 0);
                    const rate = response.message.rate;
                    const place_quantity_number_of_birds = response.message.place_quantity_number_of_birds;
                    if (!placement_date) {
                        frappe.msgprint(__('Placement date not found for the selected batch.'));
                        return;
                    }

                    // Calculate 1st-week mortality from Daily Transaction
                    frappe.call({
                        method: "frappe.client.get_list",
                        args: {
                            doctype: "CBF Daily Transaction",
                            filters: [
                                ["batch", "=", frm.doc.batch],
                                ["transaction_date", ">=", placement_date],
                                ["transaction_date", "<=", frappe.datetime.add_days(placement_date, 7)]
                            ],
                            fields: ["mortality_number_of_birds"]
                        },
                        callback: function (res) {
                            if (res.message) {
                                let total_mortality = res.message.reduce((sum, record) => sum + (record.mortality_number_of_birds || 0), 0);

                                const mortality_percent = (total_mortality / live_batch_quantity) * 100;

                                // Bind the total mortality to the fw_mortality field
                                frm.set_value("first_week_mortality", total_mortality);
                                // frm.set_value("total_sale_quantity", total_sale_quantity);
                                frm.set_value("mortality_percentage", mortality_percent.toFixed(2)); // Limit to 2 decimal places

                                frappe.msgprint(__('First-week mortality calculated successfully.'));
                            } else {
                                frappe.msgprint(__('No mortality records found for the first week.'));
                                frm.set_value("first_week_mortality", 0);
                            }
                        }
                    });


                    frappe.call({
                        method: "frappe.client.get_list",
                        args: {
                            doctype: "CBF Daily Transaction",
                            filters: [
                                ["batch", "=", frm.doc.batch],
                                ["transaction_date", ">=", placement_date],
                                ["transaction_date", "<=", live_batch_date]
                            ],
                            fields: ["feed_consumed_quantity", "feed_cost"]
                        },
                        callback: function (res) {
                            if (res.message) {

                                const total_feed_quantity = res.message.reduce((sum, record) => sum + (parseFloat(record.feed_consumed_quantity) || 0), 0);
                                const total_feed_cost = res.message.reduce((sum, record) => sum + (parseFloat(record.feed_cost) || 0), 0);


                                // Bind the total feed quantity and cost to respective fields
                                frm.set_value("total_feed_consumed", total_feed_quantity);
                                frm.set_value("feed_cost", total_feed_cost);

                                // Get delivered weight
                                const delivered_weight = parseFloat(frm.doc.total_delivered_weight) || 0;

                                if (delivered_weight === 0) {
                                    frappe.msgprint(__('Total Delivered Weight is zero, cannot calculate FCR.'));
                                    frm.set_value("fcr", 0);
                                } else {
                                    // Calculate FCR
                                    const fcr = total_feed_cost / delivered_weight;

                                    // Set the calculated FCR in the form
                                    frm.set_value("fcr", fcr.toFixed(2));

                                    
                                }

                                frappe.msgprint(__('Feed quantity and cost calculated successfully.'));

                            } else {
                                frappe.msgprint(__('No feed records found.'));
                                frm.set_value("feed_consumed_quantity", 0);
                                frm.set_value("feed_cost", 0);
                            }
                        }
                    });

                    frappe.call({
                        method: "wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_delivered_weights",  // Replace with your app name
                        args: {
                            batch: frm.doc.batch  // Pass selected batch from form
                        },
                        callback: function (response) {
                            if (response.message) {
                                console.log("Delivered Weights:", response.message);

                                let total_weight = response.message.reduce((sum, record) =>
                                    sum + (parseFloat(record.weight) || 0), 0
                                );

                                // Display the total delivered weight
                                frappe.msgprint(__('Total Delivered Weight: ') + total_weight);
                                frm.set_value("total_delivered_weight", total_weight);

                                // Get total sales quantity
                                const total_sales_quantity = (frm.doc.total_sale_quantity) || 0;

                                if (total_sales_quantity === 0) {
                                    frappe.msgprint(__('Total Sales Quantity is zero, cannot calculate Average Weight of Birds.'));
                                    frm.set_value("average_weight_of_birds", 0);
                                } else {
                                    // Calculate average weight of birds
                                    const average_weight_of_birds = total_weight / total_sales_quantity;

                                    // Set the calculated average weight in the form
                                    frm.set_value("average_weight_of_birds", average_weight_of_birds.toFixed(2));

                                }




                            } else {
                                frappe.msgprint(__('No records found for the given batch.'));
                            }
                        }
                    });



                    // frappe.call({

                    //     method: "frappe.client.get_list",
                    //     args: {
                    //         doctype: "CBF Daily Transaction",
                    //         filters: { batch: frm.doc.batch },
                    //         fields: ["feed_consumed_quantity", "average_bird_weight_in_grams"]
                    //     },
                    //     callback: function (response) {


                    //         frappe.call({
                    //             method: "frappe.client.get_list",
                    //             args: {
                    //                 doctype: "CBF Daily Transaction",
                    //                 filters: { batch: frm.doc.batch },
                    //                 fields: ["feed_consumed_quantity", "average_bird_weight_in_grams"]
                    //             },
                    //             callback: function (response) {
                    //                 if (response.message && response.message.length > 0) {
                    //                     let total_feed = 0;
                    //                     let total_weight = 0;

                    //                     response.message.forEach(record => {
                    //                         total_feed += parseFloat(record.feed_consumed_quantity) || 0;
                    //                         total_weight += parseFloat(record.average_bird_weight_in_grams) || 0;
                    //                     });

                    //                     // Convert total weight from grams to kilograms
                    //                     let total_weight_kg = total_weight / 1000;

                    //                     if (total_weight === 0) {
                    //                         frappe.msgprint(__('Total weight is zero, cannot calculate FCR.'));
                    //                         frm.set_value("fcr", 0);
                    //                     } else {
                    //                         let fcr = total_feed / total_weight_kg;
                    //                         frm.set_value("fcr", fcr.toFixed(2)); // Set FCR value
                    //                         frappe.msgprint(__('FCR calculated successfully: ') + fcr.toFixed(2));
                    //                     }
                    //                 } else {
                    //                     frappe.msgprint(__('No transaction records found for the selected batch.'));
                    //                     frm.set_value("fcr", 0);
                    //                 }
                    //             }
                    //         });
                    //     }
                    // });





                }
            }
        });
    },
    scheme_production_cost: function (frm) {

        if (frm.doc.production_cost) {
            // Retrieve necessary fields from the form
            let actualProductionCost = parseFloat(frm.doc.production_cost);
            let totalDeliveredWeight = parseFloat(frm.doc.total_delivered_weight);
            let schemeProductionCost = parseFloat(frm.doc.scheme_production_cost);
            let rearingCharges = parseFloat(frm.doc.rearing_charge);
            let productionIncentive = 1;

            // Check if totalDeliveredWeight is valid to avoid division by zero
            if (totalDeliveredWeight === 0) {
                frappe.msgprint(__('Total Delivered Weight cannot be zero for rearing charge calculation.'));
                return;
            }

            // Calculate Actual Production Cost Per Unit
            let productionCostPerUnit = Number((actualProductionCost / totalDeliveredWeight).toFixed(2));

            let actualRearingCharge;

            // Calculate Actual Rearing Charge based on the conditions
            if (productionCostPerUnit < schemeProductionCost) {
                actualRearingCharge = (rearingCharges + ((schemeProductionCost - productionCostPerUnit) * productionIncentive) / 100);
            } else {
                actualRearingCharge = (rearingCharges - ((productionCostPerUnit - schemeProductionCost) * productionIncentive) / 100);
            }

            // Set the calculated value to the `actual_rearing_charge` field
            frm.set_value("actual_rearing_chargekg", actualRearingCharge);
            // frm.set_value("total_sale_quantity", 80);

            let rearingchargeperkg;
            rearingchargeperkg = ((totalDeliveredWeight * actualRearingCharge) / (frm.doc.total_sale_quantity)).toFixed(2);

            // Set the calculated value to the `actual_rearing_charge` field
            frm.set_value("rearing_chargebird", rearingchargeperkg);
        }
    },

    actual_rearing_chargekg: function (frm) {
        if (frm.doc.actual_rearing_chargekg) {
            frm.set_value("total_rearing_charges", (frm.doc.actual_rearing_chargekg * (frm.doc.total_delivered_weight)).toFixed(2));
        }
    },

    administrative_cost: function (frm) {
        if (!frm.doc.batch) {
            frappe.msgprint(__('Please select a batch'));
            return;
        }

        // Fetch the placement date from the Batch doctype
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "CBF Batch",
                name: frm.doc.batch
            },
            callback: function (response) {
                if (response.message) {
                    let placement_date = response.message.opening_date;
                    let live_batch_date = response.message.live_batch_date;
                    const live_batch_quantity = parseFloat(response.message.live_quantity_number_of_birds || 0);
                    const rate = response.message.rate;
                    const place_quantity_number_of_birds = response.message.place_quantity_number_of_birds;
                    if (!placement_date) {
                        frappe.msgprint(__('Placement date not found for the selected batch.'));
                        return;
                    }

                    const feed_cost = parseFloat(frm.doc.feed_cost);
                    const medicine_cost = parseFloat(frm.doc.medicine_cost);
                    const vaccine_cost = parseFloat(frm.doc.vaccine_cost);
                    const administrative_cost = frm.doc.administrative_cost;
                    // Calculate Production Cost
                    const production_cost = feed_cost + medicine_cost + vaccine_cost + administrative_cost + (rate * place_quantity_number_of_birds);
                    console.log("", production_cost);

                    // Set the calculated production cost in the respective field
                    frm.set_value("production_cost", production_cost.toFixed(2)); // Round to 2 decimal places

                    // Get total delivered weight
                    const total_delivered_weight = parseFloat(frm.doc.total_delivered_weight) || 0;

                    if (total_delivered_weight === 0) {
                        frappe.msgprint(__('Total Delivered Weight is zero, cannot calculate Production Cost per kg.'));
                        frm.set_value("production_cost_per_kg", 0);
                    } else {
                        // Calculate production cost per kg
                        const production_cost_per_kg = production_cost / total_delivered_weight;

                        // Set values in the form
                        frm.set_value("production_cost", production_cost.toFixed(2));  // Round to 2 decimal places
                        frm.set_value("production_costkg", production_cost_per_kg.toFixed(2));

                        console.log("Production Cost per kg:", production_cost_per_kg);
                        frappe.msgprint(__('Production Cost per kg calculated successfully: ') + production_cost_per_kg.toFixed(2));
                    }


                }
            }
        });
    }
});
