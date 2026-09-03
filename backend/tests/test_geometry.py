"""Tests for the vector helpers in app.vision.geometry."""

import math

import numpy as np

from app.vision.geometry import angle, distance


def test_distance_is_euclidean():
    a = np.array([0.0, 0.0, 0.0])
    b = np.array([3.0, 4.0, 0.0])
    assert distance(a, b) == 5.0


def test_angle_of_a_right_angle():
    a = np.array([1.0, 0.0, 0.0])
    b = np.array([0.0, 0.0, 0.0])
    c = np.array([0.0, 1.0, 0.0])
    assert math.isclose(angle(a, b, c), math.pi / 2, abs_tol=1e-9)


def test_angle_of_a_straight_line_is_pi():
    a = np.array([-1.0, 0.0, 0.0])
    b = np.array([0.0, 0.0, 0.0])
    c = np.array([1.0, 0.0, 0.0])
    assert math.isclose(angle(a, b, c), math.pi, abs_tol=1e-9)


def test_angle_is_stable_when_points_coincide():
    zero = np.zeros(3)
    assert angle(zero, zero, zero) == math.pi
