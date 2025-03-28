// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Growing Charges", {

    cost_from_batch: function (frm) {
        if (frm.doc.cost_from_batch && frm.doc.cost_from_scheme) {
            frm.set_value('cost_from_scheme', 0);
            frappe.msgprint(__('You can only select one option. Cost from Batch is selected.'));
        }
    },

    cost_from_scheme: function (frm) {
        if (frm.doc.cost_from_scheme && frm.doc.cost_from_batch) {
            frm.set_value('cost_from_batch', 0);
            frappe.msgprint(__('You can only select one option. Cost from Scheme is selected.'));
        }
    },

    onload: function (frm) {



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
                    let contractBatch = response.message.find(bt => bt.batch_type.toLowerCase() === "contract");

                    if (contractBatch) {
                        let contract_id = contractBatch.name; // Retrieve the contract ID

                        // Now, set the query for the Batch field using this ID
                        frm.set_query("batch", function () {
                            return {
                                filters: {
                                    batch_type: contract_id,
                                    gc_calculated: "No" // Only show batches where GC Calculated
                                }

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

    scheme: function (frm) {

        console.log("", frm.doc.scheme);
        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_scheme_with_child', // Replace with your custom method path
            args: {
                scheme_name: frm.doc.scheme  // Filter using the selected scheme name
            },
            callback: function (r) {

                let costDetails = r.message.cost_details[0];

                frm.set_value("rearing_charge", costDetails.rearing_charge);
                frm.set_value("scheme_production_cost", costDetails.production_cost);


            }
        })



    },

    refresh(frm) {

        frm.add_custom_button("Calculate GC", () => {
            // frappe.show_alert("It works")

            // Retrieve necessary fields from the form
            let totalDeliveredWeight = frm.doc.total_delivered_weight;
            let actualRearingCharges = frm.doc.actual_rearing_chargekg;
            let mortalityIncentive = frm.doc.mortality_incentive || 0;
            let excessBirdIncentive = frm.doc.excess_bird_incentive || 0;
            let fcrIncentive = frm.doc.fcr_incentive || 0;
            let salesIncentive;
            let pquantity = frm.doc.placed_quanity || 0;
            let morpercentage = frm.doc.mortality_percentage || 0;
            let scheme = frm.doc.scheme;
            let shortageAmount;

            console.log(morpercentage);
            console.log(scheme);

            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Scheme Management',
                    filters: {
                        name: frm.doc.scheme  // Filter based on the selected scheme name
                    },
                    fields: ['*'] // This fetches all fields

                },
                callback: function (r) {

                    if (r.message && r.message.length > 0) {
                        console.log("All Records:", r.message);
                        let selectedScheme = r.message[0];



                        frappe.call({
                            method: 'wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_batch_cost', // Replace with your custom method path
                            args: {
                                batch: frm.doc.batch  // Filter using the selected scheme name
                            },
                            callback: function (r) {
                                let batchCost = r.message.batch_cost;


                                console.log(batchCost);
                                let avgsellingrate = batchCost / frm.doc.total_delivered_weight;

                                // Round to 2 decimal places
                                avgsellingrate = parseFloat(avgsellingrate.toFixed(2));

                                frappe.call({
                                    method: 'wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_selling_rate', // Adjust the path
                                    args: {
                                        selling_rate: avgsellingrate
                                    },
                                    callback: function (r) {
                                        let incentive = r.message.incentive || 0;
                                        frappe.call({
                                            method: 'wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_batch_rates', // Adjust the path
                                            args: {
                                                batch: frm.doc.batch
                                            },
                                            callback: function (r) {

                                                if (r.message) {

                                                    const { feed_rate, medicine_rate, rate } = r.message;
                                                    console.log("Feed Rate:", feed_rate, "Medicine Rate:", medicine_rate, "Rate:", rate);

                                                    frappe.call({
                                                        method: 'wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_scheme_with_child', // Replace with your custom method path
                                                        args: {
                                                            scheme_name: frm.doc.scheme  // Filter using the selected scheme name
                                                        },
                                                        callback: function (r) {
                                                            if (r.message) {

                                                                // let selectedScheme = r.message.scheme;
                                                                let costDetails = r.message.cost_details[0];


                                                                let from_avg_body_weight = costDetails.from_avg_body_weight;
                                                                let to_avg_body_weight = costDetails.to_avg_body_weight;
                                                                let production_cost = costDetails.production_cost;
                                                                let rearing_charge = costDetails.rearing_charge;
                                                                let stdfcr = costDetails.fcr;

                                                                // Use the fields of the selected scheme
                                                                let administration_cost = selectedScheme.administration_cost;
                                                                let feed_cost;
                                                                let chick_cost;

                                                                if (frm.doc.cost_from_batch == 1) {
                                                                    feed_cost = feed_rate;
                                                                    chick_cost = rate;
                                                                }
                                                                else {
                                                                    feed_cost = selectedScheme.feed_cost;
                                                                    chick_cost = selectedScheme.chick_cost;
                                                                }

                                                                console.log("", feed_cost);
                                                                console.log("", chick_cost);


                                                                let mortality_deductions = selectedScheme.mortality_deductions;
                                                                let medicine_cost = selectedScheme.medicine_cost;
                                                                let vaccine_cost = selectedScheme.vaccine_cost;


                                                                let bird_incentive = selectedScheme.bird_incentive;
                                                                let bird_incentive_per_bird = selectedScheme.bird_incentive_per_bird;
                                                                let bird_incentive_percentage = selectedScheme.bird_incentive_percentage;
                                                                let production_incentive = selectedScheme.production_incentive;


                                                                let FCRdeductions = selectedScheme.feed_conversion_ratio_fcr_deduction;
                                                                let mortality_percentage = selectedScheme.first_week_mortality_threshold;
                                                                let cumulative_mortality_limit = selectedScheme.cumulative_mortality_limit;
                                                                let excess_first_week_mortality_penalty = selectedScheme.excess_first_week_mortality_penalty;
                                                                let bird_short_recovery = selectedScheme.bird_short_recovery;
                                                                let minimum_rearing_charges = selectedScheme.minimum_rearing_charges;

                                                                let excess_bird_incentive_per_kg = selectedScheme.excess_bird_incentive_per_kg;
                                                                let if_total_mortality_is_less_than = selectedScheme.if_total_mortality_is_less_than;
                                                                let company_vehicle_incentive_per_kg = selectedScheme.company_vehicle_incentive_per_kg;
                                                                let mortality_incentive;
                                                                let totalMortalityDeduction;

                                                                // Check if total mortality percentage is less than cumulative percentage
                                                                if (morpercentage < cumulative_mortality_limit) {
                                                                    let mortality_incentive = (pquantity * ((cumulative_mortality_limit - morpercentage) / 100)) * bird_incentive_percentage;


                                                                } else {
                                                                    console.log("Total mortality percentage exceeds or equals cumulative percentage. No incentive applied.");
                                                                }

                                                                let fwMortalityDeduction;
                                                                let avgWeight = frm.doc.average_weight_of_birds;
                                                                let fcrincentive;
                                                                let fcrdeductions;
                                                                // Check if actual mortality percentage is greater than standard mortality percentage

                                                                console.log("Mor", morpercentage);
                                                                console.log("Mor %", mortality_percentage);
                                                                console.log("frm.doc.first_week_mortality_percentage %", frm.doc.first_week_mortality_percentage);
                                                                console.log("excess_first_week_mortality_penalty", excess_first_week_mortality_penalty);
                                                                console.log("pquantity", pquantity);
                                                                console.log("chick_cost", chick_cost);
                                                                console.log("Mor %", morpercentage);


                                                                if (morpercentage > mortality_percentage) {

                                                                    if (frm.doc.first_week_mortality_percentage > excess_first_week_mortality_penalty) {
                                                                        fwMortalityDeduction = ((frm.doc.first_week_mortality - (pquantity * (excess_first_week_mortality_penalty / 100))) * chick_cost);

                                                                        mortalityFinal = (morpercentage - frm.doc.first_week_mortality_percentage - (mortality_percentage - excess_first_week_mortality_penalty));

                                                                        if (mortalityFinal > 0) {
                                                                            mortalityQuantity = pquantity * (mortalityFinal / 100);

                                                                            // Step 8: Calculate total mortality deduction
                                                                            totalMortalityDeduction = mortalityQuantity * chick_cost * avgWeight;
                                                                        }

                                                                    }
                                                                    else {
                                                                        let quantity = (morpercentage - frm.doc.first_week_mortality_percentage);
                                                                        let perqty = (pquantity * (mortality_percentage - excess_first_week_mortality_penalty / 100));
                                                                        let Mortalityqty = (quantity - perqty);
                                                                        let deduction = Mortalityqty * avgWeight * chick_cost;

                                                                        totalMortalityDeduction = deduction;
                                                                    }

                                                                }
                                                                else {
                                                                    totalMortalityDeduction = mortality_percentage;
                                                                }

                                                                // FCR INCENTIVE
                                                                if (frm.doc.fcr && stdfcr && feed_cost) {

                                                                    let fcrDifference = frm.doc.fcr - stdfcr;

                                                                    // Calculate Delivered Weight using a function or fetched data
                                                                    let deliveredWeight = frm.doc.total_delivered_weight; // Replace with actual function or value

                                                                    if (deliveredWeight > 0) {
                                                                        // Calculate FCR Incentive
                                                                        fcrincentive = fcrDifference * deliveredWeight * feed_cost;

                                                                        // Round to 2 decimal places
                                                                        fcrincentive = Math.round(fcrincentive * 100) / 100;

                                                                        console.log("FCR Incentive:", fcrincentive);
                                                                    } else {
                                                                        console.log("Delivered weight not found.");
                                                                    }
                                                                } else {
                                                                    console.log("Missing required values for FCR incentive calculation.");
                                                                }


                                                                // FCR DEDUCTIONS
                                                                if (frm.doc.fcr && stdfcr && frm.doc.production_costkg && production_cost) {

                                                                    let fcrDeduction = 0;
                                                                    let excessFeedInKg = 0;

                                                                    // Calculate Delivered Weight (Assuming this value is already fetched)
                                                                    let deliveredWeight = frm.doc.total_delivered_weight;

                                                                    if (frm.doc.fcr > stdfcr && frm.doc.production_costkg > production_cost) {
                                                                        // Step 1: Calculate excess feed in KG
                                                                        excessFeedInKg = (deliveredWeight * stdfcr) - frm.doc.total_feed_consumed;

                                                                        if (excessFeedInKg > 0) {

                                                                            // Step 2a: Apply scheme feed cost
                                                                            fcrdeductions = excessFeedInKg * feed_cost;

                                                                            // Step 3: Round off to 2 decimal places
                                                                            fcrdeductions = Math.round(fcrdeductions * 100) / 100;

                                                                            console.log("FCR Deduction:", fcrdeductions);
                                                                        } else {
                                                                            console.log("No excess feed consumption detected.");
                                                                        }
                                                                    } else {
                                                                        fcrdeductions = 0;
                                                                    }
                                                                } else {
                                                                    console.log("Missing required values for FCR deduction calculation.");
                                                                }


                                                                // excessamount

                                                                let pcostperkg = frm.doc.production_costkg;
                                                                let excessBird;


                                                                if (avgsellingrate > pcostperkg) {
                                                                    // Condition 1: Avg. Selling Rate > Actual Production Cost per Kg
                                                                    excessBird = pcostperkg * (excessBirdIncentive * avgWeight);
                                                                } else {
                                                                    // Condition 2: Avg. Selling Rate <= Actual Production Cost per Kg
                                                                    excessBird = avgsellingrate * (excessBirdIncentive * avgWeight);
                                                                }

                                                                // Check for NaN or undefined and set to 0 if invalid
                                                                if (isNaN(excessBird) || excessBird === undefined) {
                                                                    excessBird = 0;
                                                                }

                                                                // Shortage amount



                                                                if (avgsellingrate > pcostperkg) {
                                                                    // Condition 1: Avg. Selling Rate > Actual Production Cost per Kg
                                                                    shortageAmount = pcostperkg * (frm.doc.shortage_birds * avgWeight);
                                                                } else {
                                                                    // Condition 2: Avg. Selling Rate <= Actual Production Cost per Kg
                                                                    shortageAmount = avgsellingrate * (frm.doc.shortage_birds * avgWeight);
                                                                }

                                                                // Check for NaN or undefined and set to 0 if invalid
                                                                if (isNaN(shortageAmount) || shortageAmount === undefined) {
                                                                    shortageAmount = 0;
                                                                }

                                                                salesIncentive = incentive * frm.doc.total_delivered_weight;
                                                                // ✅ Output Results

                                                                totalMortalityDeduction = parseFloat((totalMortalityDeduction || 0).toFixed(3));  // Round up to 3 decimals
                                                                fcrdeductions = (typeof fcrdeductions !== 'undefined' && fcrdeductions !== null) ? parseFloat(fcrdeductions.toFixed(3)) : 0;

                                                                // Calculate the Rearing Charges Payable
                                                                let rearingChargesPayable = (
                                                                    ((totalDeliveredWeight * actualRearingCharges) +
                                                                        (mortalityIncentive + excessBird + ((fcrincentive ?? 0)) + salesIncentive)) -
                                                                    (totalMortalityDeduction + fcrdeductions + shortageAmount)
                                                                );

                                                                // Round the result to 2 decimal places
                                                                rearingChargesPayable = Number(rearingChargesPayable.toFixed(2));

                                                                // Bind the calculated value to the `rearing_charges_payable` field
                                                                frm.set_value("net_payable_amount", rearingChargesPayable);


                                                                // Optional: Show a success message
                                                                frappe.msgprint(__('Rearing Charges Payable calculated successfully.'));




                                                            }
                                                        }
                                                    })
                                                }

                                            }
                                        })

                                    }
                                })

                            }
                        })


                    }
                }
            })
            // let totalMortalityDeduction = frm.doc.total_mortality_deduction || 0;
            // let fcrDeductions = frm.doc.fcr_deductions || 0;
            // let shortageAmount = frm.doc.shortage_amount || 0;

        })
    },


    actual_rearing_chargekg: function (frm) {
        if (frm.doc.actual_rearing_chargekg) {
            frm.set_value("total_rearing_charges", (frm.doc.actual_rearing_chargekg * (frm.doc.total_delivered_weight)).toFixed(2));

        }
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
                doctype: "Broiler Batch",
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
                            doctype: "Broiler Daily Transaction",
                            filters: [
                                ["batch", "=", frm.doc.batch],
                                ["transaction_date", ">=", placement_date],
                                ["transaction_date", "<=", frappe.datetime.add_days(placement_date, 7)]
                            ],
                            fields: ["total_mortality_qty"]
                        },
                        callback: function (res) {
                            if (res.message) {
                                let total_mortality_per = res.message.reduce((sum, record) => sum + (record.total_mortality_qty || 0), 0);

                                const mortality_percent = (frm.doc.total_mortality / place_quantity_number_of_birds) * 100;

                                const mortality_percent2 = (total_mortality_per / place_quantity_number_of_birds) * 100;

                                // Bind the total mortality to the fw_mortality field
                                frm.set_value("first_week_mortality", total_mortality_per);

                                frm.set_value("first_week_mortality_percentage", mortality_percent2.toFixed(2));
                                // frm.set_value("total_sale_quantity", total_sale_quantity);
                                frm.set_value("mortality_percentage", mortality_percent.toFixed(2)); // Limit to 2 decimal places

                                frappe.msgprint(__('First-week mortality calculated successfully.'));


                                // feed cost
                                frappe.call({
                                    method: "frappe.client.get_list",
                                    args: {
                                        doctype: "Broiler Daily Transaction",
                                        filters: [
                                            ["batch", "=", frm.doc.batch],
                                            ["transaction_date", ">=", placement_date],
                                            ["transaction_date", "<=", live_batch_date]
                                        ],
                                        fields: ["actual_total_feed_consumption", "feed_cost"]
                                    },
                                    callback: function (res) {
                                        if (res.message) {

                                            const total_feed_quantity = res.message.reduce((sum, record) => sum + (parseFloat(record.actual_total_feed_consumption) || 0), 0);
                                            const total_feed_cost = res.message.reduce((sum, record) => sum + (parseFloat(record.feed_cost) || 0), 0);

                                            console.log("", frm.doc.cost_from_batch);

                                            if (frm.doc.cost_from_batch == 1) {
                                                frappe.db.get_doc('Broiler Batch', frm.doc.batch).then(r => {
                                                    let { feed_rate, medicine_rate, rate } = r || {};
                                                    let total_feed_cost2 = (feed_rate || 0) * total_feed_quantity;
                                                    frm.set_value("total_feed_consumed", total_feed_quantity);
                                                    frm.set_value("feed_cost", total_feed_cost2);
                                                });
                                            }
                                            else {
                                                frm.set_value("total_feed_consumed", total_feed_quantity);
                                                frm.set_value("feed_cost", total_feed_cost);
                                            }



                                            frappe.msgprint(__('Feed quantity and cost calculated successfully.'));

                                            // get delivered weight
                                            frappe.call({
                                                method: "wh_poultryos.poultryos.doctype.growing_charges.growing_charges.get_delivered_weights",  // Replace with your app name
                                                args: {
                                                    batch: frm.doc.batch // Pass selected batch from form

                                                },
                                                callback: function (response) {
                                                    if (response.message) {
                                                        console.log("Delivered Weights:", response.message);
                                                        let total_feed_cost;
                                                        let total_weight = response.message.delivered_weights.reduce((sum, record) =>
                                                            sum + (parseFloat(record.weight) || 0), 0
                                                        );

                                                        if (frm.doc.cost_from_batch == 1) {
                                                            frappe.db.get_doc('Broiler Batch', frm.doc.batch).then(r => {
                                                                let { feed_rate, medicine_rate, rate, total_feed } = r || {};
                                                                let total_feed_cost2 = total_feed;
                                                                total_feed_cost = total_feed_cost2;
                                                                const fcr = total_feed_cost / total_weight;
                                                                frm.set_value("fcr", fcr.toFixed(2));
                                                                console.log("FCR Calculated:", fcr.toFixed(2));
                                                            });
                                                        }
                                                        else {
                                                            total_feed_cost = response.message.total_feed;
                                                            const fcr = total_feed_cost / total_weight;
                                                            frm.set_value("fcr", fcr.toFixed(2));
                                                            console.log("FCR Calculated:", fcr.toFixed(2));
                                                        }

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

                                                        if (frm.doc.administrative_cost) {
                                                            // Fetch the placement date from the Batch doctype
                                                            frappe.call({
                                                                method: "frappe.client.get",
                                                                args: {
                                                                    doctype: "Broiler Batch",
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

                                                                        let production_cost;

                                                                        // Get chick_cost from Scheme Management
                                                                        frappe.db.get_doc('Scheme Management', frm.doc.scheme).then(s => {
                                                                            let chick_cost = s ? s.chick_cost : 0;

                                                                            // Use chick_cost only if cost_from_batch == 1, otherwise keep it as rate
                                                                            let final_rate = frm.doc.cost_from_batch == 1 ? rate : chick_cost;

                                                                            // Calculate Production Cost
                                                                            production_cost = feed_cost + medicine_cost + vaccine_cost + administrative_cost + (final_rate * place_quantity_number_of_birds);

                                                                            // Log and set value
                                                                            console.log("Production Cost:", production_cost);
                                                                            frm.set_value("production_cost", production_cost.toFixed(2)); // Round to 2 decimal places

                                                                            // Get total delivered weight
                                                                            const total_delivered_weight = parseFloat(frm.doc.total_delivered_weight) || 0;

                                                                            if (total_delivered_weight === 0) {
                                                                                frappe.msgprint(__('Total Delivered Weight is zero, cannot calculate Production Cost per kg.'));
                                                                                frm.set_value("production_costkg", 0);
                                                                            } else {
                                                                                // Calculate production cost per kg
                                                                                const production_cost_per_kg = production_cost / total_delivered_weight;

                                                                                // Round to 2 decimal places
                                                                                frm.set_value("production_costkg", production_cost_per_kg.toFixed(2));

                                                                                console.log("Production Cost per kg:", production_cost_per_kg);
                                                                                frappe.msgprint(__('Production Cost per kg calculated successfully: ') + production_cost_per_kg.toFixed(2));
                                                                            }
                                                                        });


                                                                        // // Calculate Production Cost
                                                                        // const production_cost = feed_cost + medicine_cost + vaccine_cost + administrative_cost + (rate * place_quantity_number_of_birds);
                                                                        // console.log("", production_cost);

                                                                        // Get chick_cost from Scheme Management
                                                                        // frappe.db.get_doc('Scheme Management', frm.doc.scheme).then(s => {
                                                                        //     let chick_cost = s ? s.chick_cost : 0;

                                                                        //     // Use chick_cost only if cost_from_batch == 1, otherwise keep it as rate
                                                                        //     let final_rate = frm.doc.cost_from_batch == 1 ? chick_cost : rate;

                                                                        //     // Calculate Production Cost
                                                                        //     production_cost = feed_cost + medicine_cost + vaccine_cost + administrative_cost + (final_rate * place_quantity_number_of_birds);

                                                                        //     // Log and set value
                                                                        //     console.log("Production Cost:", production_cost);
                                                                        //     frm.set_value("production_cost", production_cost.toFixed(2)); // Round to 2 decimal places
                                                                        // });

                                                                        // // Get total delivered weight
                                                                        // const total_delivered_weight = parseFloat(frm.doc.total_delivered_weight) || 0;

                                                                        // if (total_delivered_weight === 0) {
                                                                        //     frappe.msgprint(__('Total Delivered Weight is zero, cannot calculate Production Cost per kg.'));
                                                                        //     frm.set_value("production_cost_per_kg", 0);
                                                                        // } else {
                                                                        //     // Calculate production cost per kg
                                                                        //     const production_cost_per_kg = production_cost / total_delivered_weight;


                                                                        //     // Round to 2 decimal places
                                                                        //     frm.set_value("production_costkg", production_cost_per_kg.toFixed(2));

                                                                        //     console.log("Production Cost per kg:", production_cost_per_kg);
                                                                        //     frappe.msgprint(__('Production Cost per kg calculated successfully: ') + production_cost_per_kg.toFixed(2));

                                                                        // }

                                                                        // scheme production cost
                                                                        if (frm.doc.production_cost) {
                                                                            // Retrieve necessary fields from the form
                                                                            let actualProductionCost = parseFloat(frm.doc.production_cost);
                                                                            let totalDeliveredWeight = parseFloat(frm.doc.total_delivered_weight);
                                                                            let schemeProductionCost = parseFloat(frm.doc.scheme_production_cost);
                                                                            let rearingCharges = parseFloat(frm.doc.rearing_charge);
                                                                            let productionIncentive = frm.doc.production_incentive;

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

                                                                    }
                                                                }
                                                            });
                                                        }


                                                    } else {
                                                        frappe.msgprint(__('No records found for the given batch.'));
                                                    }
                                                }
                                            });

                                        } else {
                                            frappe.msgprint(__('No feed records found.'));
                                            frm.set_value("feed_consumed_quantity", 0);
                                            frm.set_value("feed_cost", 0);
                                        }
                                    }
                                });


                            } else {
                                frappe.msgprint(__('No mortality records found for the first week.'));
                                frm.set_value("first_week_mortality", 0);
                            }
                        }
                    });


                    // administrator cost
                    // if (frm.doc.administrative_cost) {
                    //     // Fetch the placement date from the Batch doctype
                    //     frappe.call({
                    //         method: "frappe.client.get",
                    //         args: {
                    //             doctype: "Broiler Batch",
                    //             name: frm.doc.batch
                    //         },
                    //         callback: function (response) {
                    //             if (response.message) {

                    //                 let placement_date = response.message.opening_date;
                    //                 let live_batch_date = response.message.live_batch_date;
                    //                 const live_batch_quantity = parseFloat(response.message.live_quantity_number_of_birds || 0);
                    //                 const rate = response.message.rate;
                    //                 const place_quantity_number_of_birds = response.message.place_quantity_number_of_birds;

                    //                 if (!placement_date) {
                    //                     frappe.msgprint(__('Placement date not found for the selected batch.'));
                    //                     return;
                    //                 }

                    //                 const feed_cost = parseFloat(frm.doc.feed_cost);
                    //                 const medicine_cost = parseFloat(frm.doc.medicine_cost);
                    //                 const vaccine_cost = parseFloat(frm.doc.vaccine_cost);
                    //                 const administrative_cost = frm.doc.administrative_cost;

                    //                 let production_cost;

                    //                 // Get chick_cost from Scheme Management
                    //                 frappe.db.get_doc('Scheme Management', frm.doc.scheme).then(s => {
                    //                     let chick_cost = s ? s.chick_cost : 0;

                    //                     // Use chick_cost only if cost_from_batch == 1, otherwise keep it as rate
                    //                     let final_rate = frm.doc.cost_from_batch == 1 ? rate : chick_cost;

                    //                     // Calculate Production Cost
                    //                     production_cost = feed_cost + medicine_cost + vaccine_cost + administrative_cost + (final_rate * place_quantity_number_of_birds);

                    //                     // Log and set value
                    //                     console.log("Production Cost:", production_cost);
                    //                     frm.set_value("production_cost", production_cost.toFixed(2)); // Round to 2 decimal places

                    //                     // Get total delivered weight
                    //                     const total_delivered_weight = parseFloat(frm.doc.total_delivered_weight) || 0;

                    //                     if (total_delivered_weight === 0) {
                    //                         frappe.msgprint(__('Total Delivered Weight is zero, cannot calculate Production Cost per kg.'));
                    //                         frm.set_value("production_costkg", 0);
                    //                     } else {
                    //                         // Calculate production cost per kg
                    //                         const production_cost_per_kg = production_cost / total_delivered_weight;

                    //                         // Round to 2 decimal places
                    //                         frm.set_value("production_costkg", production_cost_per_kg.toFixed(2));

                    //                         console.log("Production Cost per kg:", production_cost_per_kg);
                    //                         frappe.msgprint(__('Production Cost per kg calculated successfully: ') + production_cost_per_kg.toFixed(2));
                    //                     }
                    //                 });

                    //                 // scheme production cost
                    //                 if (frm.doc.production_cost) {
                    //                     // Retrieve necessary fields from the form
                    //                     let actualProductionCost = parseFloat(frm.doc.production_cost);
                    //                     let totalDeliveredWeight = parseFloat(frm.doc.total_delivered_weight);
                    //                     let schemeProductionCost = parseFloat(frm.doc.scheme_production_cost);
                    //                     let rearingCharges = parseFloat(frm.doc.rearing_charge);
                    //                     let productionIncentive = frm.doc.production_incentive;

                    //                     // Check if totalDeliveredWeight is valid to avoid division by zero
                    //                     if (totalDeliveredWeight === 0) {
                    //                         frappe.msgprint(__('Total Delivered Weight cannot be zero for rearing charge calculation.'));
                    //                         return;
                    //                     }

                    //                     // Calculate Actual Production Cost Per Unit
                    //                     let productionCostPerUnit = Number((actualProductionCost / totalDeliveredWeight).toFixed(2));

                    //                     let actualRearingCharge;

                    //                     // Calculate Actual Rearing Charge based on the conditions
                    //                     if (productionCostPerUnit < schemeProductionCost) {
                    //                         actualRearingCharge = (rearingCharges + ((schemeProductionCost - productionCostPerUnit) * productionIncentive) / 100);
                    //                     } else {
                    //                         actualRearingCharge = (rearingCharges - ((productionCostPerUnit - schemeProductionCost) * productionIncentive) / 100);
                    //                     }

                    //                     // Set the calculated value to the `actual_rearing_charge` field
                    //                     frm.set_value("actual_rearing_chargekg", actualRearingCharge);
                    //                     // frm.set_value("total_sale_quantity", 80);

                    //                     let rearingchargeperkg;
                    //                     rearingchargeperkg = ((totalDeliveredWeight * actualRearingCharge) / (frm.doc.total_sale_quantity)).toFixed(2);

                    //                     // Set the calculated value to the `actual_rearing_charge` field
                    //                     frm.set_value("rearing_chargebird", rearingchargeperkg);


                    //                 }

                    //             }
                    //         }
                    //     });
                    // }

                }
            }
        });
    },


    after_save: function (frm) {

        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.growing_charges.growing_charges.update_batches',
            args: {
                batch: frm.doc.batch,
                status: "Yes"  // Ensure 'batch' exists in the document
            },
            callback: function (r) {
                if (r.message.status === "success") {
                    frappe.msgprint(__('GC UPDATED.'));
                    // Update the growing_charges field in Broiler Batch
                    let finalvalue = frm.doc.net_payable_amount;
                    frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: "Broiler Batch",
                            name: frm.doc.batch,  // Pass batch name or ID
                            fieldname: "growing_charges",
                            value: finalvalue
                        },
                        callback: function (response) {
                            if (!response.exc) {

                            } else {
                                frappe.msgprint("Failed to update growing charges.");
                            }
                        }
                    });
                    console.log("", frm.doc.net_payable_amount);
                } else {

                }
            }
        });
    }
});

function handleMortalityData(res, frm) {
    let total_mortality_per = res.reduce((sum, record) => sum + (record.total_mortality_qty || 0), 0);
    const mortality_percent2 = (total_mortality_per / place_quantity_number_of_birds) * 100;

    frm.set_value("first_week_mortality", total_mortality_per);
    frm.set_value("first_week_mortality_percentage", mortality_percent2.toFixed(2));
    frappe.msgprint(__('First-week mortality calculated successfully.'));
}
