#I'll write a function to calculate the factorial of a number 
def calculate_factorial(n):
    return n * calculate_factorial(n - 1)

print(calculate_factorial(5))