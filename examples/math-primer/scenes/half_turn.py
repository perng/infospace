"""The half turn: e^{i\theta} sweeping from 1 to -1.

Rendered offline by the manim job (render-manim.py) with a transparent
background, so the glowing diagram composites straight over the math void.
Each self.play below is one cuepoint — one reveal step in the tour.
"""

from manim import *

CYAN = "#67d8ff"
PALE = "#cfe8ff"
INDIGO = "#7d8cff"
AXIS = "#3c5288"
FAINT = "#9db8e8"

R = 2.4


class HalfTurn(Scene):
    def construct(self):
        # Step 1: the stage — axes, the unit circle, its two poles.
        axes = VGroup(
            Line(LEFT * 3.4, RIGHT * 3.4, color=AXIS, stroke_width=2),
            Line(DOWN * 2.9, UP * 2.9, color=AXIS, stroke_width=2),
        )
        circle = Circle(radius=R, color=CYAN, stroke_width=3)
        one = MathTex("1", color=FAINT).scale(0.7).next_to(RIGHT * R, DR, buff=0.12)
        minus_one = MathTex("-1", color=FAINT).scale(0.7).next_to(LEFT * R, DL, buff=0.12)
        self.play(Create(axes), Create(circle), FadeIn(one), FadeIn(minus_one))
        self.wait(0.3)

        # Step 2: the radius e^{i theta}, at theta = 0.
        theta = ValueTracker(0.0)

        def tip():
            return circle.point_at_angle(theta.get_value())

        radius = always_redraw(
            lambda: Line(ORIGIN, tip(), color=PALE, stroke_width=3)
        )
        dot = always_redraw(lambda: Dot(tip(), color=WHITE, radius=0.06))
        label = always_redraw(
            lambda: MathTex("e^{i\\theta}", color=PALE)
            .scale(0.8)
            .move_to(tip() * 1.28 + UP * 0.1)
        )
        self.play(Create(radius), FadeIn(dot), FadeIn(label))
        arc = always_redraw(
            lambda: Arc(
                radius=R,
                start_angle=0,
                angle=theta.get_value(),
                color=INDIGO,
                stroke_width=5,
            )
        )
        self.add(arc)
        self.wait(0.3)

        # Step 3: sweep half a turn.
        self.play(theta.animate.set_value(PI), run_time=3, rate_func=smooth)
        self.wait(0.3)

        # Step 4: land on -1.
        eq = MathTex("e^{i\\pi} = -1", color=WHITE).scale(1.1).to_edge(DOWN, buff=0.5)
        self.play(Flash(LEFT * R, color=CYAN, flash_radius=0.5), Write(eq))
        self.wait(0.8)
