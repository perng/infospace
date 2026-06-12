# Basel Night Lecture

> Linear handout derived from the spatial presentation model — 9 beats across The Evening Lecture Hall and The Math Void.

## What Is This Sum
*The Evening Lecture Hall · What Is This Sum*

### The Basel problem

What number is hiding behind this infinite sum?

1 + 1/4 + 1/9 + 1/16 + ...

In modern language, it is the sum of 1/n^2 over all positive integers.
In 1734, it was one of the great open problems of European mathematics.


**Narration:** We begin with a question that looks harmless. Add one, then one fourth, then one ninth, then one sixteenth, and keep going forever. The terms are shrinking, but the sum is still a mystery. This is the Basel problem, and tonight we follow Euler to its answer.


**Speaker notes:** State the problem before naming the method.

## The Sum Settles Down
*The Evening Lecture Hall · The Sum Settles Down*

```latex
\sum_{n=1}^{\infty} \frac{1}{n^{2}} \leq 1 + \int_{1}^{\infty} \frac{1}{x^{2}}\,dx = 2
```

*Spoken:* the sum from n equals one to infinity of one over n squared is at most one plus the integral from one to infinity of one over x squared dx, which equals two

**Narration:** First, this infinite sum really does converge. A simple integral comparison shows that after the first term, the remaining area is bounded. So the answer exists, and it is less than two. But existence is not the same thing as knowing the number.


**Speaker notes:** Emphasize rigor before the dramatic leap.

## Slow Partial Sums
*The Evening Lecture Hall · Slow Partial Sums*

### Partial sums of 1/n^2

The partial sums climb quickly at first, then creep toward about one point six four four nine.

| | |
| --- | --- |
| N=1 | 1 value |
| N=2 | 1.25 value |
| N=5 | 1.464 value |
| N=10 | 1.55 value |
| N=50 | 1.625 value |
| N=100 | 1.635 value |
| limit | 1.645 value |

**Narration:** Direct calculation gives us a trail of approximations. The first few terms move quickly, but then the progress becomes painfully slow. Even after one hundred terms, the answer is still not fully visible. Euler needed a way to see the limit all at once.


**Speaker notes:** Let the chart make the slowness tangible.

## Through the Board
*The Evening Lecture Hall · Through the Board*

### The risky idea

Leave arithmetic behind.

Euler will treat a function as if it were an infinite polynomial,
then listen to its roots.


**Narration:** The lecture hall has taken us as far as ordinary summation can go. Euler's next move is bold enough to feel like stepping through the board itself. He will compare a familiar power series with a shadowy infinite product. The calculation is daring, but the clue it reveals is unmistakable.


**Speaker notes:** Transition from standard estimates to Euler's formal argument.

## Sine Has Known Zeros
*The Math Void · Sine Has Known Zeros*

```latex
\frac{\sin x}{x} = \left(1-\frac{x^{2}}{\pi^{2}}\right)\left(1-\frac{x^{2}}{4\pi^{2}}\right)\left(1-\frac{x^{2}}{9\pi^{2}}\right)\cdots
```

*Spoken:* sine x over x equals one minus x squared over pi squared times one minus x squared over four pi squared times one minus x squared over nine pi squared and so on

**Narration:** In the void, roots become architecture. The function sine x over x is zero at plus and minus pi, plus and minus two pi, plus and minus three pi, and so on. Euler imagined it as an infinite polynomial whose factors remember exactly those zeros.


**Speaker notes:** Connect each factor to the roots of sine.

## The Ordinary Expansion
*The Math Void · The Ordinary Expansion*

```latex
\frac{\sin x}{x} = 1 - \frac{x^{2}}{3!} + \frac{x^{4}}{5!} - \cdots
```

*Spoken:* sine x over x equals one minus x squared over three factorial plus x to the fourth over five factorial minus and so on

**Narration:** The same function also has a power series known from calculus. Divide the sine series by x, and the coefficient of x squared is negative one sixth. This coefficient is the hinge of the whole argument. Euler now has two descriptions of one object.


**Speaker notes:** Prepare for comparing the x squared coefficient.

## Reading The Coefficient
*The Math Void · Reading The Coefficient*

```latex
\text{coefficient of }x^{2}:\quad -\left(\frac{1}{\pi^{2}}+\frac{1}{4\pi^{2}}+\frac{1}{9\pi^{2}}+\cdots\right) = -\frac{1}{6}
```

*Spoken:* the coefficient of x squared is minus the quantity one over pi squared plus one over four pi squared plus one over nine pi squared and so on, and this equals minus one sixth

**Narration:** Multiply the infinite factors only far enough to read the x squared term. From the product, that coefficient is the negative sum of one over pi squared, one over four pi squared, one over nine pi squared, and onward. From the power series, the same coefficient is negative one sixth. The unknown Basel sum has appeared inside a coefficient.


**Speaker notes:** Make clear that only the x squared term is being compared.

## Pi Squared Over Six
*The Math Void · Pi Squared Over Six*

```latex
\sum_{n=1}^{\infty} \frac{1}{n^{2}} = \frac{\pi^{2}}{6}
```

*Spoken:* the sum from n equals one to infinity of one over n squared equals pi squared over six

**Narration:** Now cancel the minus signs and multiply by pi squared. The answer is not a decimal reached by patient addition. It is pi squared over six. A sum over square numbers has secretly been governed by the geometry of the circle.


**Speaker notes:** Let this scene be the dramatic peak.

## Beyond Basel
*The Math Void · Beyond Basel*

### From Euler to zeta

Euler's answer became one point on a larger map.

zeta(2) = pi^2/6
zeta(s) = 1 + 1/2^s + 1/3^s + 1/4^s + ...

The Basel problem opened a road from infinite series to prime numbers,
complex functions, and eventually Riemann's zeta function.


**Narration:** Euler did more than solve a famous sum. He revealed that infinite series, trigonometric functions, and the primes could belong to one story. The modern zeta function grows from this soil. The tour ends at a gate, with the blackboard behind us and a much larger mathematics ahead.


**Speaker notes:** Close by tying Euler's computation to the zeta function and Riemann.
