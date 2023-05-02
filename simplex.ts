
const mathjs = require('mathjs');

var iteration = 0;
let original_artificial: object = {};
let original_slack: object = {}
function format_system(A: string[][], b: string[], c: string[]) {
    A = A.map(row => {
        row = row.map(value => {
            if (decimal_value(value) != 0) {
                if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                    return value.split('/')[0];
                }
                return value;
            }
            return '0'
        });
        return row;
    });

    b = b.map(value => {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0'
    });

    c = c.map(value => {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0'
    });

    return { A, b, c }

}



function print_system(signs: string[], A: string[][], b: string[]) {

    console.log("Given equations are ");
    let equation_matrix = A.map(row => [...row]);
    equation_matrix.forEach((row, rowIndex) => {
        row.push(signs[rowIndex]);
        row.push(b[rowIndex]);
    });
    console.table(equation_matrix);

}

function handle_unrestricted(unrestricted: number[], A: string[][], c: string[]) {
    let count = 0;
    // handling unrestricted variables.
    unrestricted.forEach((i) => {
        A = A.map(row => {
            console.log("Replace variable X" + i + " with  new variable X" + i + " -X" + (i + 1) + " and replace other variables e.g X4 by X5 , X5 by X6 and so on. ");
            row.splice(i + 1 + count, 0, `-${row[i + count]}`);
            return row;
        });
        c.splice(i + 1 + count, 0, `-${c[i + count]}`);
        count++
    });
    return { A, c, count }
}



function add_slack_artificial(B: number[], N: number[], A: string[][], signs: string[], artificial: number[], total_variables: number) {
    original_artificial = [];
    original_slack = []
    // iterate over each row and depending of signs add slack or artificial variable in A;
    signs.forEach((sign, index1) => {

        if (sign == '<=') {
            console.log("Add a slack variable in equation no : ", index1 + 1);
            B.push(total_variables);
            original_slack.push({});
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach((row, index2) => {
                if (index1 != index2) {
                    row.push('0');
                }
            })
        }

        if (sign == '>=') {
            console.log("Add a slack variable and an artificial variable in equation no : ", index1 + 1);

            N.push(total_variables);
            total_variables++;
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('-1');
            A[index1].push('1');
            artificial.push(total_variables)
            // push 0 at all other row
            A.forEach((row, index2) => {
                if (index1 != index2) {
                    row.push('0');
                    row.push('0');
                }
            })
        }
        if (sign == '=') {
            console.log("Add  an artificial variable in equation no : ", index1 + 1);
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach((row, index2) => {
                if (index1 != index2) {
                    row.push('0');
                }
            });
            artificial.push(total_variables);
        }

        total_variables++;
    });

    return {
        N,
        A,
        B,
        total_variables
    }
}


function initial_feasible(A: string[][], b: string[]) {
    // each b[i] is postive after this.
    b.forEach((b_val, b_index) => {
        if (b_val[0] == '-') {
            if (decimal_value(b_val) != 0) {
                console.log("Reverese equation number : ", b_index);
                b[b_index] = b_val.substring(1);
                A[b_index].forEach((a_val, a_index) => {
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
                })
            }
            else {
                b[b_index] = '0';
            }
        }

    });
    return {
        A, b
    }

}

function remember_variables(A: string[][], artificial: number[], c: string[]) {
    let slack_count = A[0].length - artificial.length - c.length;
    let art_count = artificial.length;
    let total_count = A[0].length;
    let original_count = A[0].length - art_count - slack_count;
    for (let i = original_count; i < original_count + slack_count; i++) {
        original_slack[`s${i}`] = i;
    }
    for (let i = original_count + slack_count; i < total_count; i++) {
        original_artificial[`a${i}`] = i;
    }
    console.log(original_artificial, original_slack);
}

function handle_artificial(N: number[], B: number[], artificial: number[], A: string[][], b: string[], c: string[]) {

    if (artificial.length > 0) {
        let c1: string[] = [];

        /************putting artificial at end of A  *********** */

        let new_A1: string[][] = [];

        // first push  non artificial coloumn 

        A.forEach((row, row_ind) => {
            let tempArray: string[] = []
            row.forEach((col, col_ind) => {
                if (!artificial.includes(col_ind)) {
                    tempArray.push(col);
                }
            });
            new_A1.push(tempArray);
        });

        // push artificial column
        A.forEach((row, row_ind) => {
            row.forEach((col, col_ind) => {
                if (artificial.includes(col_ind)) {
                    new_A1[row_ind].push(col);
                }
            });
        });

        let artificial_count = artificial.length;



        // fill basic and non basic variables;

        B = [];
        N = [];

        for (let j = 0; j < new_A1[0].length; j++) {

            let is_basic = true;
            let ones_count = 0;
            let one_pos = -1;

            for (let i = 0; i < new_A1.length; i++) {
                // if there is some other value in col then it is not a basic variable.
                if (new_A1[i][j] != '0' && new_A1[i][j] != '1') {
                    is_basic = false;
                    break;
                }
                if (new_A1[i][j] == '1') {
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
        artificial = artificial.map((val, ind) => {
            return A[0].length - artificial_count + ind;
        });

        // setting cofficient of new system . set cofficient of artificial variable -1 and others to 0;
        B.forEach(val => {
            if (artificial.includes(val)) {
                c1[val] = '-1';
            }
            else c1[val] = '0';
        });
        // set cofficient others to 0;
        N.forEach(val => {
            c1[val] = '0';
        });

        A = [...new_A1]
        let new_system_sol = simplex_phase1_iterator(N, B, artificial, A, b, c1);
        N = new_system_sol.N;
        B = new_system_sol.B;
        A = new_system_sol.A;
        b = new_system_sol.b;


        artificial.forEach(value => {
            if (B.includes(value)) {
                throw Error("This problem has no solution")
            }
        });
        // cofficient was reduced by removing artificial variables. Resize it to A[0].length.
        while (c.length < A[0].length) {
            c.push('0');
        }

    }
    return { N, B, A, b, c }

}

function initiate_simplex(artificial: number[], signs: string[], unrestricted: number[], A: string[][], b: string[], c: string[]) {



    print_system(signs, A, b);
    let total_original_var = A[0].length;

    let formatted_data = format_system(A, b, c);
    A = formatted_data.A;
    b = formatted_data.b;
    c = formatted_data.c;
    let N: number[] = [];
    let B: number[] = [];

    let restricted_stystem = handle_unrestricted(unrestricted, A, c);
    A = restricted_stystem.A;
    c = restricted_stystem.c;
    let count = restricted_stystem.count;



    var total_variables = A[0].length;
    // pushing all non basic variable
    A[0].forEach(function (var_, index) { return N.push(index); });


    let standard_system = add_slack_artificial(B, N, A, signs, artificial, total_variables);
    A = standard_system.A;
    B = standard_system.B;
    N = standard_system.N;
    total_variables = standard_system.total_variables;


    let initial_feasible_system = initial_feasible(A, b);
    A = initial_feasible_system.A;
    b = initial_feasible_system.b;

    remember_variables(A, artificial, c);


    if (artificial.length > 0) {
        console.log("PHASE 1 STARTS NOW..");
        let phase1_sol = handle_artificial(N, B, artificial, A, b, c);
        A = phase1_sol.A;
        N = phase1_sol.N;
        B = phase1_sol.B;
        c = phase1_sol.c;
        b = phase1_sol.b;
    }

    else {
        while (c.length < A[0].length) {
            c.push('0')
        }
    }


    if (artificial.length) {
        console.log("Phase 2");
    }
    let final_sol = simplex_phase2_iterator(N, B, A, b, c);


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


    let z_max = '0';


    B.forEach((elem, ind) => {
        z_max = fractional_string(mathjs.fraction(mathjs.parse(`(${z_max})+(${b[ind]})*(${c[elem]})`).evaluate()))
    });

    console.log("Optimal value of z is :", z_max);;


    // for unrestricted variables;


    if (unrestricted.length) {
        console.log("Restore original variables : ");
        count = 0;
        let X: string[] = [];
        let X1: string[] = []



        B.forEach((elem, ind) => {
            X[elem] = fractional_string(mathjs.fraction(mathjs.parse(b[ind]).evaluate()));
        });

        for (let i = 0; i < A[0].length; i++) {
            if (!X[i]) {
                X[i] = '0';
            }
        }

        let i = 0;
        X.forEach((elem, ind) => {
            if (unrestricted.includes(ind)) {
                X1.push(fractional_string(mathjs.fraction(mathjs.parse(`${X[i + count]}-${X[i + count + 1]}`).evaluate())));
                count++;
            }
            else {
                X1.push(X[i + count]);
            }
            i++;

        });

        X1.forEach((elem, ind) => {
            console.log("Optimal value of X" + ind + " is : ", elem);
        });

    }

    else {
        B.forEach((elem, ind) => {
            if (elem < total_original_var) {
                console.log("Optimal value of X" + elem + " is : ", b[ind]);
            }
        });

    }

    console.log('THANKS FOR USING SIMPLEX SOLVER BY GOVIND KUMAR KUSHWAHA');


}

function common_task(N: number[], B: number[], A: string[][], b: string[], c: string[], artificial?: number[]) {

    let N1: number[] = [];
    let B1: number[] = [...B];
    let A1 = A.map(row => [...row]);
    let b1 = [...b];
    let cjzj: string[] = [];
    let zj: string[] = [];


    for (let j = 0; j < A[0].length; j++) {
        let z_sum = '0';
        for (let i = 0; i < A.length; i++) {
            z_sum = fractional_string(mathjs.fraction(mathjs.parse(`${z_sum}+(${A[i][j]})*${c[B[i]]}`).evaluate()))
        }
        zj.push(z_sum);
    }

    c.forEach((ci, ind) => {
        cjzj.push(fractional_string(mathjs.fraction(mathjs.parse(`${ci}-${zj[ind]}`).evaluate())))
    });


    let max_col_index: number = -1;
    let max_col_value = '-1';

    cjzj.forEach((val, ind) => {
        if ((mathjs.parse(val).evaluate() > 0) && (mathjs.compare(mathjs.parse(`${val}`).evaluate(), mathjs.parse(`${max_col_value}`).evaluate()) == 1)) {
            max_col_index = ind;
            max_col_value = val;
        }
    });


    if (max_col_index == -1) {
        return {
            A,
            B,
            N,
            b,
            optimal: true,
            leaving_var: -1,
            artificial
        }
    }


    let min_ratio_index: number = -1;
    let min_ratio_value: string = '';

    // checking if any postive ratio exists
    A.forEach((row, ind) => {
        if (mathjs.parse(`${row[max_col_index]}`).evaluate() > 0 && mathjs.parse(`${b[ind]}`).evaluate() >= 0) {
            min_ratio_index = ind;
            min_ratio_value = mathjs.parse(`(${b[ind]})/(${A[ind][max_col_index]})`).evaluate();
        }
    });

    if (min_ratio_index == -1) {
        throw Error("UNBOUNDED SOLUTION")
    }



    // // checking for min positive ratio


    A.forEach((row, ind) => {
        if (mathjs.parse(`${row[max_col_index]}`).evaluate() > 0) {
            let ratio = mathjs.parse(`(${b[ind]})/(${row[max_col_index]})`).evaluate();
            if (ratio >= 0) {
                if (mathjs.compare(ratio, min_ratio_value) == -1 || (artificial && (artificial.includes(B[ind]) && mathjs.compare(ratio, min_ratio_value) == 0))) {
                    min_ratio_index = ind;
                    min_ratio_value = ratio;
                }
            }
        }
    });

    console.log("Z(j) is given by")
    console.table(zj);
    console.log("C(j)-Z(j) is given by ");
    console.table(cjzj);
    console.log("Pivot row ", min_ratio_index);
    console.log("Pivot column ", max_col_index);
    console.log("Outgoing variable ", B[min_ratio_index]);
    console.log("Incoming variable ", max_col_index);

    B1 = B1.map((val, ind) => {
        if (ind == min_ratio_index) {
            return max_col_index;
        }
        return val;
    });


    let pivot_element = A[min_ratio_index][max_col_index];
    let leaving_var = B[min_ratio_index];


    A1 = A.map(row => [...row]);
    b1 = [...b];


    b1[min_ratio_index] = fractional_string(mathjs.fraction(mathjs.parse(`(${b[min_ratio_index]})/${pivot_element}`).evaluate()));
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < A[0].length; j++) {
            if (i != min_ratio_index) {
                if (!B1.includes(j)) {
                    A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse(`((${A[i][j]})*(${pivot_element})-(${A[i][max_col_index]})*${A[min_ratio_index][j]})/(${pivot_element})`).evaluate()));
                }
                b1[i] = fractional_string(mathjs.fraction(mathjs.parse(`((${b[i]})*(${pivot_element})-(${A[i][max_col_index]})*${b[min_ratio_index]})/(${pivot_element})`).evaluate()));
            }
            else {
                A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse(`(${A[i][j]})/(${pivot_element})`).evaluate()))
                b1[i] = fractional_string(mathjs.fraction(mathjs.parse(`(${b[i]})/(${pivot_element})`).evaluate()));
            }
        }
    }



    for (let i = 0; i < A.length; i++) {
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
        A1 = A1.map((row) => {
            row.splice(B[min_ratio_index], 1);
            return row;
        });
    }



    N1 = []
    // filtering basic and non basic variables.

    for (let j = 0; j < A1[0].length; j++) {

        let is_basic = true;
        let ones_count = 0;
        let one_pos = -1;

        for (let i = 0; i < A1.length; i++) {
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
        leaving_var,
        optimal: false,
        artificial
    }
}


function simplex_phase1(N: number[], B: number[], A: string[][], b: string[], c: string[], artificial: number[]) {

    if (artificial.length == 0) {
        return {
            A,
            B,
            N,
            b,
            artificial,
            optimal: true,
            c
        }
    }


    let aux_sol = common_task(N, B, A, b, c, artificial);

    if (aux_sol.optimal && aux_sol.artificial && aux_sol.artificial.length != 0) {
        throw new Error("No solution found for this problem.")
    }

    N = aux_sol.N;
    B = aux_sol.B;
    A = aux_sol.A;
    b = aux_sol.b;

    if (aux_sol.artificial) {
        artificial = aux_sol.artificial;
    }

    let c1: string[] = [...c];
    let leaving_var = aux_sol.leaving_var;


    if (artificial.includes(leaving_var)) {
        c1 = [];
        c.forEach((val, ind) => {
            if (ind != leaving_var) {
                c1.push(val);
            }
        });
    }

    let artificial1: number[] = [];


    artificial.forEach(a_val => {
        if (a_val != leaving_var) {
            artificial1.push(a_val);
        }
    });

    // reseting all  artificial variable after deleting any artificial variable.
    artificial1 = artificial1.map((val) => {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });

    artificial = [...artificial1];
    // reseting all basic variable after deleting any artificial variable.
    B = B.map((val) => {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });

    N = [];

    A[0].forEach((col, ind) => {
        if (!B.includes(ind)) {
            N.push(ind);
        }
    })


    return {
        A,
        B,
        N,
        b,
        artificial,
        optimal: false,
        c: c1
    }


}


function simplex_phase1_iterator(N: number[], B: number[], artificial: number[], A: string[][], b: string[], c: string[]) {

    while (true) {
        let solution = simplex_phase1(N, B, A, b, c, artificial);
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

    return { N, B, A, b, c }
}

function simplex_phase2_iterator(N: number[], B: number[], A: string[][], b: string[], c: string[]) {

    while (true) {
        let solution = common_task(N, B, A, b, c);

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

    return { N, B, A, b, c }
}



function take_input() {

    var A: string[][] = [[]];
    var b: string[] = [];
    var c: string[] = [];
    var artificial: number[] = [];
    var signs: string[] = []
    var unrestricted: number[] = []

    A = [
        ['2', '1', '2'],
        ['4', '4', '4'],
        ['2', '4', '5'],
    ]
    c = ['5', '10', '8'];
    b = ['60', '5', '80'];
    signs = ['<=', '>=', '<='];
    // unrestricted.push(2);
    // unrestricted.push(3);
    initiate_simplex(artificial, signs, unrestricted, A, b, c);
}

take_input()

function decimal_value(value: string): number {
    let result = value.split('/');
    if (result.length == 1) {
        return Number(result[0]);
    }
    else if (result.length == 2) {
        return Number(result[0]) / Number(result[1]);
    }
    throw new Error("Invalid fraction value")
}

function fractional_string(value: any) {
    if (value.s == -1) {
        if (value.d == value.n) {
            return '-1'
        }
        if (value.d != 1) return `-${value.n}/${value.d}`;
        return `-${value.n}`
    }
    if (value.d == value.n) {
        return '1'
    }
    if (value.d != 1) return `${value.n}/${value.d}`;
    return `${value.n}`
}

function fraction_value(value: string): { n: number, d?: number } {
    let result = value.split('/');
    if (result.length == 1) {
        return { n: Number(result[0]) }
    }
    else if (result.length == 2) {
        return { n: Number(result[0]), d: Number(result[1]) }

    }
    throw new Error("Invalid fraction value")
}



