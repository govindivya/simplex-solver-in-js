var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var mathjs = require('mathjs');
var iteration = 0;
function format_system(A, b, c) {
    A = A.map(function (row) {
        row = row.map(function (value) {
            if (decimal_value(value) != 0) {
                if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                    return value.split('/')[0];
                }
                return value;
            }
            return '0';
        });
        return row;
    });
    b = b.map(function (value) {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0';
    });
    c = c.map(function (value) {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0';
    });
    return { A: A, b: b, c: c };
}
function print_system(signs, A, b) {
    console.log("Given equations are ");
    var equation_matrix = A.map(function (row) { return __spreadArray([], row, true); });
    equation_matrix.forEach(function (row, rowIndex) {
        row.push(signs[rowIndex]);
        row.push(b[rowIndex]);
    });
    console.table(equation_matrix);
}
function handle_unrestricted(unrestricted, A, c) {
    var count = 0;
    // handling unrestricted variables.
    unrestricted.forEach(function (i) {
        A = A.map(function (row) {
            console.log("Replace variable X" + i + " with  new variable X" + i + " -X" + (i + 1) + " and replace other variables e.g X4 by X5 , X5 by X6 and so on. ");
            row.splice(i + 1 + count, 0, "-".concat(row[i + count]));
            return row;
        });
        c.splice(i + 1 + count, 0, "-".concat(c[i + count]));
        count++;
    });
    return { A: A, c: c, count: count };
}
function add_slack_artificial(B, N, A, signs, artificial, total_variables) {
    // iterate over each row and depending of signs add slack or artificial variable in A;
    signs.forEach(function (sign, index1) {
        if (sign == '<=') {
            console.log("Add a slack variable in equation no : ", index1 + 1);
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach(function (row, index2) {
                if (index1 != index2) {
                    row.push('0');
                }
            });
        }
        if (sign == '>=') {
            console.log("Add a slack variable and an artificial variable in equation no : ", index1 + 1);
            N.push(total_variables);
            total_variables++;
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('-1');
            A[index1].push('1');
            artificial.push(total_variables);
            // push 0 at all other row
            A.forEach(function (row, index2) {
                if (index1 != index2) {
                    row.push('0');
                    row.push('0');
                }
            });
        }
        if (sign == '=') {
            console.log("Add  an artificial variable in equation no : ", index1 + 1);
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach(function (row, index2) {
                if (index1 != index2) {
                    row.push('0');
                }
            });
            artificial.push(total_variables);
        }
        total_variables++;
    });
    return {
        N: N,
        A: A,
        B: B,
        total_variables: total_variables
    };
}
function initial_feasible(A, b) {
    // each b[i] is postive after this.
    b.forEach(function (b_val, b_index) {
        if (b_val[0] == '-') {
            if (decimal_value(b_val) != 0) {
                console.log("Reverese equation number : ", b_index);
                b[b_index] = b_val.substring(1);
                A[b_index].forEach(function (a_val, a_index) {
                    // value is negative remove minus sign
                    if (decimal_value(a_val) != 0) {
                        if (a_val[0] == '-') {
                            A[b_index][a_index] = a_val.substring(1);
                        }
                        //else add minus sign.
                        else {
                            A[b_index][a_index] = '-' + a_val;
                        }
                    }
                    else {
                        A[b_index][a_index] = '0';
                    }
                });
            }
            else {
                b[b_index] = '0';
            }
        }
    });
    return {
        A: A,
        b: b
    };
}
function handle_artificial(N, B, artificial, A, b, c) {
    if (artificial.length > 0) {
        var c1_1 = [];
        /************putting artificial at end of A  *********** */
        var new_A1_1 = [];
        // first push  non artificial coloumn 
        A.forEach(function (row, row_ind) {
            var tempArray = [];
            row.forEach(function (col, col_ind) {
                if (!artificial.includes(col_ind)) {
                    tempArray.push(col);
                }
            });
            new_A1_1.push(tempArray);
        });
        // push artificial column
        A.forEach(function (row, row_ind) {
            row.forEach(function (col, col_ind) {
                if (artificial.includes(col_ind)) {
                    new_A1_1[row_ind].push(col);
                }
            });
        });
        var artificial_count_1 = artificial.length;
        // fill basic and non basic variables;
        B = [];
        N = [];
        for (var j = 0; j < new_A1_1[0].length; j++) {
            var is_basic = true;
            var ones_count = 0;
            var one_pos = -1;
            for (var i = 0; i < new_A1_1.length; i++) {
                // if there is some other value in col then it is not a basic variable.
                if (new_A1_1[i][j] != '0' && new_A1_1[i][j] != '1') {
                    is_basic = false;
                    break;
                }
                if (new_A1_1[i][j] == '1') {
                    one_pos = i;
                    ones_count++;
                }
            }
            if (ones_count > 1 || !is_basic) {
                N.push(j);
            }
            else {
                B[one_pos] = j;
            }
        }
        // return new index of artificial variable.
        artificial = artificial.map(function (val, ind) {
            return A[0].length - artificial_count_1 + ind;
        });
        // setting cofficient of new system . set cofficient of artificial variable -1 and others to 0;
        B.forEach(function (val) {
            if (artificial.includes(val)) {
                c1_1[val] = '-1';
            }
            else
                c1_1[val] = '0';
        });
        // set cofficient others to 0;
        N.forEach(function (val) {
            c1_1[val] = '0';
        });
        A = __spreadArray([], new_A1_1, true);
        var new_system_sol = simplex_phase1_iterator(N, B, artificial, A, b, c1_1);
        N = new_system_sol.N;
        B = new_system_sol.B;
        A = new_system_sol.A;
        b = new_system_sol.b;
        artificial.forEach(function (value) {
            if (B.includes(value)) {
                throw Error("This problem has no solution");
            }
        });
        // cofficient was reduced by removing artificial variables. Resize it to A[0].length.
        while (c.length < A[0].length) {
            c.push('0');
        }
    }
    return { N: N, B: B, A: A, b: b, c: c };
}
function initiate_simplex(artificial, signs, unrestricted, A, b, c) {
    print_system(signs, A, b);
    var total_original_var = A[0].length;
    var formatted_data = format_system(A, b, c);
    A = formatted_data.A;
    b = formatted_data.b;
    c = formatted_data.c;
    var N = [];
    var B = [];
    var restricted_stystem = handle_unrestricted(unrestricted, A, c);
    A = restricted_stystem.A;
    c = restricted_stystem.c;
    var count = restricted_stystem.count;
    var total_variables = A[0].length;
    // pushing all non basic variable
    A[0].forEach(function (var_, index) { return N.push(index); });
    var standard_system = add_slack_artificial(B, N, A, signs, artificial, total_variables);
    A = standard_system.A;
    B = standard_system.B;
    N = standard_system.N;
    total_variables = standard_system.total_variables;
    var initial_feasible_system = initial_feasible(A, b);
    A = initial_feasible_system.A;
    b = initial_feasible_system.b;
    if (artificial.length > 0) {
        console.log("PHASE 1 STARTS NOW..");
        var phase1_sol = handle_artificial(N, B, artificial, A, b, c);
        A = phase1_sol.A;
        N = phase1_sol.N;
        B = phase1_sol.B;
        c = phase1_sol.c;
        b = phase1_sol.b;
    }
    else {
        while (c.length < A[0].length) {
            c.push('0');
        }
    }
    if (artificial.length) {
        console.log("Phase 2");
    }
    var final_sol = simplex_phase2_iterator(N, B, A, b, c);
    N = final_sol.N;
    B = final_sol.B;
    A = final_sol.A;
    b = final_sol.b;
    console.log("Final A matrix : ");
    console.table(A);
    console.log("Final b matrix: ");
    console.table(b);
    console.log("Final basic :");
    console.table(B);
    var z_max = '0';
    B.forEach(function (elem, ind) {
        z_max = fractional_string(mathjs.fraction(mathjs.parse("(".concat(z_max, ")+(").concat(b[ind], ")*(").concat(c[elem], ")")).evaluate()));
    });
    console.log("Optimal value of z is :", z_max);
    ;
    // for unrestricted variables;
    if (unrestricted.length) {
        console.log("Restore original variables : ");
        count = 0;
        var X_1 = [];
        var X1 = [];
        B.forEach(function (elem, ind) {
            X_1[elem] = fractional_string(mathjs.fraction(mathjs.parse(b[ind]).evaluate()));
        });
        for (var i = 0; i < A[0].length; i++) {
            if (!X_1[i]) {
                X_1[i] = '0';
            }
        }
        unrestricted.forEach(function (elem, ind) {
        });
    }
    B.forEach(function (elem, ind) {
        if (elem < total_original_var) {
            console.log("Optimal value of X" + elem + " is : ", b[ind]);
        }
    });
    console.log('THANKS FOR USING SIMPLEX SOLVER BY GOVIND KUMAR KUSHWAHA');
}
function common_task(N, B, A, b, c, artificial) {
    var N1 = [];
    var B1 = __spreadArray([], B, true);
    var A1 = A.map(function (row) { return __spreadArray([], row, true); });
    var b1 = __spreadArray([], b, true);
    var cjzj = [];
    var zj = [];
    for (var j = 0; j < A[0].length; j++) {
        var z_sum = '0';
        for (var i = 0; i < A.length; i++) {
            z_sum = fractional_string(mathjs.fraction(mathjs.parse("".concat(z_sum, "+(").concat(A[i][j], ")*").concat(c[B[i]])).evaluate()));
        }
        zj.push(z_sum);
    }
    c.forEach(function (ci, ind) {
        cjzj.push(fractional_string(mathjs.fraction(mathjs.parse("".concat(ci, "-").concat(zj[ind])).evaluate())));
    });
    var max_col_index = -1;
    var max_col_value = '-1';
    cjzj.forEach(function (val, ind) {
        if ((mathjs.parse(val).evaluate() > 0) && (mathjs.compare(mathjs.parse("".concat(val)).evaluate(), mathjs.parse("".concat(max_col_value)).evaluate()) == 1)) {
            max_col_index = ind;
            max_col_value = val;
        }
    });
    if (max_col_index == -1) {
        return {
            A: A,
            B: B,
            N: N,
            b: b,
            optimal: true,
            leaving_var: -1,
            artificial: artificial
        };
    }
    var min_ratio_index = -1;
    var min_ratio_value = '';
    // checking if any postive ratio exists
    A.forEach(function (row, ind) {
        if (mathjs.parse("".concat(row[max_col_index])).evaluate() > 0 && mathjs.parse("".concat(b[ind])).evaluate() >= 0) {
            min_ratio_index = ind;
            min_ratio_value = mathjs.parse("(".concat(b[ind], ")/(").concat(A[ind][max_col_index], ")")).evaluate();
        }
    });
    if (min_ratio_index == -1) {
        throw Error("UNBOUNDED SOLUTION");
    }
    // // checking for min positive ratio
    A.forEach(function (row, ind) {
        if (mathjs.parse("".concat(row[max_col_index])).evaluate() > 0) {
            var ratio = mathjs.parse("(".concat(b[ind], ")/(").concat(row[max_col_index], ")")).evaluate();
            if (ratio >= 0) {
                if (mathjs.compare(ratio, min_ratio_value) == -1 || (artificial && (artificial.includes(B[ind]) && mathjs.compare(ratio, min_ratio_value) == 0))) {
                    min_ratio_index = ind;
                    min_ratio_value = ratio;
                }
            }
        }
    });
    console.log("Z(j) is given by");
    console.table(zj);
    console.log("C(j)-Z(j) is given by ");
    console.table(cjzj);
    console.log("Pivot row ", min_ratio_index);
    console.log("Pivot column ", max_col_index);
    console.log("Outgoing variable ", B[min_ratio_index]);
    console.log("Incoming variable ", max_col_index);
    B1 = B1.map(function (val, ind) {
        if (ind == min_ratio_index) {
            return max_col_index;
        }
        return val;
    });
    var pivot_element = A[min_ratio_index][max_col_index];
    var leaving_var = B[min_ratio_index];
    A1 = A.map(function (row) { return __spreadArray([], row, true); });
    b1 = __spreadArray([], b, true);
    b1[min_ratio_index] = fractional_string(mathjs.fraction(mathjs.parse("(".concat(b[min_ratio_index], ")/").concat(pivot_element)).evaluate()));
    for (var i = 0; i < A.length; i++) {
        for (var j = 0; j < A[0].length; j++) {
            if (i != min_ratio_index) {
                if (!B1.includes(j)) {
                    A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse("((".concat(A[i][j], ")*(").concat(pivot_element, ")-(").concat(A[i][max_col_index], ")*").concat(A[min_ratio_index][j], ")/(").concat(pivot_element, ")")).evaluate()));
                }
                b1[i] = fractional_string(mathjs.fraction(mathjs.parse("((".concat(b[i], ")*(").concat(pivot_element, ")-(").concat(A[i][max_col_index], ")*").concat(b[min_ratio_index], ")/(").concat(pivot_element, ")")).evaluate()));
            }
            else {
                A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse("(".concat(A[i][j], ")/(").concat(pivot_element, ")")).evaluate()));
                b1[i] = fractional_string(mathjs.fraction(mathjs.parse("(".concat(b[i], ")/(").concat(pivot_element, ")")).evaluate()));
            }
        }
    }
    for (var i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            A1[i][max_col_index] = '0';
        }
        else {
            A1[i][max_col_index] = '1';
        }
    }
    if (artificial && artificial.length && artificial.includes(B[min_ratio_index])) {
        // remove artificial column from a which is going from basis
        console.log("Remove ", B[min_ratio_index], " variable from basis");
        A1 = A1.map(function (row) {
            row.splice(B[min_ratio_index], 1);
            return row;
        });
    }
    N1 = [];
    // filtering basic and non basic variables.
    for (var j = 0; j < A1[0].length; j++) {
        var is_basic = true;
        var ones_count = 0;
        var one_pos = -1;
        for (var i = 0; i < A1.length; i++) {
            if (A1[i][j] != '0' && A1[i][j] != '1') {
                is_basic = false;
                break;
            }
            if (A1[i][j] == '1') {
                one_pos = i;
                ones_count++;
            }
        }
        if (ones_count != 1 || !is_basic) {
            N1.push(j);
        }
        else {
            B1[one_pos] = j;
        }
    }
    return {
        A: A1,
        B: B1,
        N: N1,
        b: b1,
        leaving_var: leaving_var,
        optimal: false,
        artificial: artificial
    };
}
function simplex_phase1(N, B, A, b, c, artificial) {
    if (artificial.length == 0) {
        return {
            A: A,
            B: B,
            N: N,
            b: b,
            artificial: artificial,
            optimal: true,
            c: c
        };
    }
    var aux_sol = common_task(N, B, A, b, c, artificial);
    if (aux_sol.optimal && aux_sol.artificial && aux_sol.artificial.length != 0) {
        throw new Error("No solution found for this problem.");
    }
    N = aux_sol.N;
    B = aux_sol.B;
    A = aux_sol.A;
    b = aux_sol.b;
    if (aux_sol.artificial) {
        artificial = aux_sol.artificial;
    }
    var c1 = __spreadArray([], c, true);
    var leaving_var = aux_sol.leaving_var;
    if (artificial.includes(leaving_var)) {
        c1 = [];
        c.forEach(function (val, ind) {
            if (ind != leaving_var) {
                c1.push(val);
            }
        });
    }
    var artificial1 = [];
    artificial.forEach(function (a_val) {
        if (a_val != leaving_var) {
            artificial1.push(a_val);
        }
    });
    // reseting all  artificial variable after deleting any artificial variable.
    artificial1 = artificial1.map(function (val) {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });
    artificial = __spreadArray([], artificial1, true);
    // reseting all basic variable after deleting any artificial variable.
    B = B.map(function (val) {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });
    N = [];
    A[0].forEach(function (col, ind) {
        if (!B.includes(ind)) {
            N.push(ind);
        }
    });
    return {
        A: A,
        B: B,
        N: N,
        b: b,
        artificial: artificial,
        optimal: false,
        c: c1
    };
}
function simplex_phase1_iterator(N, B, artificial, A, b, c) {
    while (true) {
        var solution = simplex_phase1(N, B, A, b, c, artificial);
        if (solution.A && solution.b && solution.N && solution.B && solution.artificial) {
            A = solution.A;
            b = solution.b;
            B = solution.B;
            N = solution.N;
            artificial = solution.artificial;
            c = solution.c;
            console.log("A :");
            console.table(A);
            console.log("b");
            console.table(b);
            console.log("c ");
            console.table(c);
            console.log("B ");
            console.table(B);
        }
        if (solution.optimal == true) {
            break;
        }
    }
    return { N: N, B: B, A: A, b: b, c: c };
}
function simplex_phase2_iterator(N, B, A, b, c) {
    while (true) {
        var solution = common_task(N, B, A, b, c);
        if (solution.A && solution.b && solution.N && solution.B) {
            A = solution.A;
            b = solution.b;
            B = solution.B;
            N = solution.N;
        }
        if (solution.optimal == true) {
            break;
        }
    }
    return { N: N, B: B, A: A, b: b, c: c };
}
function take_input() {
    var A = [[]];
    var b = [];
    var c = [];
    var artificial = [];
    var signs = [];
    var unrestricted = [];
    A = [
        ['3', '5', '2'],
        ['4', '4', '4'],
        ['2', '4', '5'],
    ];
    c = ['5', '10', '8'];
    b = ['60', '5', '80'];
    signs = ['<=', '>=', '<='];
    // unrestricted.push(2);
    // unrestricted.push(3);
    initiate_simplex(artificial, signs, unrestricted, A, b, c);
}
take_input();
function decimal_value(value) {
    var result = value.split('/');
    if (result.length == 1) {
        return Number(result[0]);
    }
    else if (result.length == 2) {
        return Number(result[0]) / Number(result[1]);
    }
    throw new Error("Invalid fraction value");
}
function fractional_string(value) {
    if (value.s == -1) {
        if (value.d == value.n) {
            return '-1';
        }
        if (value.d != 1)
            return "-".concat(value.n, "/").concat(value.d);
        return "-".concat(value.n);
    }
    if (value.d == value.n) {
        return '1';
    }
    if (value.d != 1)
        return "".concat(value.n, "/").concat(value.d);
    return "".concat(value.n);
}
function fraction_value(value) {
    var result = value.split('/');
    if (result.length == 1) {
        return { n: Number(result[0]) };
    }
    else if (result.length == 2) {
        return { n: Number(result[0]), d: Number(result[1]) };
    }
    throw new Error("Invalid fraction value");
}
