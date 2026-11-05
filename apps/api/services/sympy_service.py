import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor
)
from typing import Dict, Any, Optional
import re
import math

transformations = standard_transformations + (implicit_multiplication_application, convert_xor)

class SymPyService:
    @staticmethod
    def clean_expression(expr_str: str) -> str:
        s = expr_str.strip()
        # Metric unit normalization
        s = re.sub(r'(\d+)\s*cm\b', r'(\1 * 1/100)', s, flags=re.IGNORECASE)
        s = re.sub(r'(\d+)\s*m\b', r'(\1)', s, flags=re.IGNORECASE)
        # Strip common LaTeX wrappers
        s = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'(\1)/(\2)', s)
        s = s.replace(r'\times', '*').replace('×', '*').replace('÷', '/')
        s = s.replace('^', '**')
        s = s.replace('$', '')
        return s

    @classmethod
    def verify_equivalence(cls, student_input: str, expected_answer: str) -> Dict[str, Any]:
        try:
            clean_student = cls.clean_expression(student_input)
            clean_expected = cls.clean_expression(expected_answer)
            
            # Check if student input is an equation like "3*x + 5 = 20"
            if '=' in clean_student and '=' not in clean_expected:
                parts = clean_student.split('=')
                lhs = parse_expr(parts[0], transformations=transformations, evaluate=True)
                rhs = parse_expr(parts[1], transformations=transformations, evaluate=True)
                # Solve for symbol
                free_syms = list((lhs - rhs).free_symbols)
                if free_syms:
                    solutions = sp.solve(lhs - rhs, free_syms[0])
                    expected_sym = parse_expr(clean_expected, transformations=transformations, evaluate=True)
                    is_match = any(sp.simplify(sol - expected_sym) == 0 for sol in solutions)
                    return {
                        "is_correct": is_match,
                        "canonical_student": str(solutions[0]) if solutions else clean_student,
                        "canonical_expected": str(expected_sym),
                        "error": None
                    }

            # Direct numeric float evaluation
            try:
                val_s = float(clean_student)
                val_e = float(clean_expected)
                is_close = math.isclose(val_s, val_e, rel_tol=1e-5, abs_tol=1e-5)
                return {
                    "is_correct": is_close,
                    "canonical_student": str(val_s),
                    "canonical_expected": str(val_e),
                    "error": None
                }
            except ValueError:
                pass
            
            # Symbolic parsing with SymPy
            sym_student = parse_expr(clean_student, transformations=transformations, evaluate=True)
            sym_expected = parse_expr(clean_expected, transformations=transformations, evaluate=True)
            
            diff = sp.simplify(sym_student - sym_expected)
            is_zero = (diff == 0)
            
            if not is_zero:
                try:
                    num_val = complex(sp.N(diff))
                    if abs(num_val) < 1e-7:
                        is_zero = True
                except Exception:
                    pass

            return {
                "is_correct": is_zero,
                "canonical_student": str(sp.simplify(sym_student)),
                "canonical_expected": str(sp.simplify(sym_expected)),
                "error": None
            }
        except Exception as ex:
            normalized_student = re.sub(r'\s+', ' ', student_input.strip().lower())
            normalized_expected = re.sub(r'\s+', ' ', expected_answer.strip().lower())
            is_exact = (normalized_student == normalized_expected)
            
            return {
                "is_correct": is_exact,
                "canonical_student": student_input.strip(),
                "canonical_expected": expected_answer.strip(),
                "error": f"Symbolic parsing note: {str(ex)}" if not is_exact else None
            }

    @classmethod
    def verify_physics_formula(
        cls,
        formula_type: str,
        student_val: float,
        inputs: Dict[str, float]
    ) -> Dict[str, Any]:
        try:
            if formula_type == "FORCE":
                m = inputs.get("mass", 0.0)
                a = inputs.get("acceleration", 0.0)
                expected = m * a
            elif formula_type == "PRESSURE":
                f = inputs.get("force", 0.0)
                area = inputs.get("area", 1.0)
                if area == 0:
                    return {"is_correct": False, "error": "Area cannot be zero"}
                expected = f / area
            else:
                return {"is_correct": False, "error": f"Unknown formula type {formula_type}"}

            is_correct = math.isclose(student_val, expected, rel_tol=1e-3, abs_tol=1e-3)
            return {
                "is_correct": is_correct,
                "computed_expected": expected,
                "student_val": student_val,
                "error": None
            }
        except Exception as ex:
            return {"is_correct": False, "error": str(ex)}
