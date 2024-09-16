// Complex number constructor and methods
function Complex(real, imag) {
    this.real = real;
    this.imag = imag;
}

Complex.prototype.add = function(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
};

Complex.prototype.sub = function(other) {
    return new Complex(this.real - other.real, this.imag - other.imag);
};

Complex.prototype.mul = function(other) {
    return new Complex(
        this.real * other.real - this.imag * other.imag,
        this.real * other.imag + this.imag * other.real
    );
};

Complex.prototype.div = function(other) {
    const denominator = other.real * other.real + other.imag * other.imag;
    return new Complex(
        (this.real * other.real + this.imag * other.imag) / denominator,
        (this.imag * other.real - this.real * other.imag) / denominator
    );
};

Complex.prototype.magnitude = function() {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
};

// Polynomial parsing for complex polynomials with custom variables
function parsePolynomial(polyString, variable = 'x') {
    // Replace the provided variable with 'x' to simplify parsing
    polyString = polyString.replace(new RegExp(variable, 'g'), 'x');
    polyString = polyString.replace(/\s+/g, '').replace(/\*/g, '');

    const termPattern = /([+-]?\d*\.?\d*)x(\^(\d+))?|([+-]?\d+\.?\d*)/g;
    let match;
    const terms = [];

    while ((match = termPattern.exec(polyString)) !== null) {
        if (match[1] !== undefined) {
            let coefficient = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
            let power = match[3] !== undefined ? parseInt(match[3]) : 1;
            terms.push({ coefficient, power });
        } else if (match[4] !== undefined) {
            terms.push({ coefficient: parseFloat(match[4]), power: 0 });
        }
    }

    // Return a function to evaluate at a complex number z
    return function(z) {
        return terms.reduce((acc, term) => {
            let zPower = new Complex(1, 0);
            for (let i = 0; i < term.power; i++) {
                zPower = zPower.mul(z);
            }
            const termResult = zPower.mul(new Complex(term.coefficient, 0));
            return acc.add(termResult);
        }, new Complex(0, 0));
    };
}

// Parse the derivative of a polynomial and return a function to evaluate it at a complex number z
function derivativePolynomial(polyString, variable = 'x') {
    // Same as parsePolynomial but derives each term
    polyString = polyString.replace(new RegExp(variable, 'g'), 'x');
    polyString = polyString.replace(/\s+/g, '').replace(/\*/g, '');

    const termPattern = /([+-]?\d*\.?\d*)x(\^(\d+))?|([+-]?\d+\.?\d*)/g;
    let match;
    const terms = [];

    while ((match = termPattern.exec(polyString)) !== null) {
        if (match[1] !== undefined) {
            let coefficient = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : parseFloat(match[1]);
            let power = match[3] !== undefined ? parseInt(match[3]) : 1;
            if (power > 0) {
                terms.push({ coefficient: coefficient * power, power: power - 1 });
            }
        }
    }

    // Return a function to evaluate the derivative at a complex number z
    return function(z) {
        return terms.reduce((acc, term) => {
            let zPower = new Complex(1, 0);
            for (let i = 0; i < term.power; i++) {
                zPower = zPower.mul(z);
            }
            const termResult = zPower.mul(new Complex(term.coefficient, 0));
            return acc.add(termResult);
        }, new Complex(0, 0));
    };
}

// Draw the Newton fractal on the canvas
function drawFractal() {
    const polynomialInput = document.getElementById('polynomial').value;
    const polynomial = parsePolynomial(polynomialInput, 'z');
    const derivative = derivativePolynomial(polynomialInput, 'z');

    const canvas = document.getElementById('fractalCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const maxIterations = 50;
    const tolerance = 1e-6;
    const scale = 4; // Range: -2 to 2 in both directions

    // Loop over each pixel
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            // Map pixel (x, y) to the complex plane
            let zx = (x - width / 2) * scale / width;
            let zy = (y - height / 2) * scale / height;

            let z = new Complex(zx, zy);
            let iteration = 0;

            while (iteration < maxIterations) {
                const fz = polynomial(z);  // f(z)
                const dfz = derivative(z);  // f'(z)

                if (dfz.magnitude() < tolerance) {
                    break;  // Avoid division by a very small number
                }

                // Newton's method update: z_new = z - f(z) / f'(z)
                const zNew = z.sub(fz.div(dfz));

                // Check if we've converged
                if (z.sub(zNew).magnitude() < tolerance) {
                    break;
                }

                z = zNew;
                iteration++;
            }

            // Color the pixel based on how quickly it converged
            const color = iteration === maxIterations ? 'black' : `hsl(${iteration * 10 % 360}, 100%, 50%)`;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}
