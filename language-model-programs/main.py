from smolagents import CodeAgent, LiteLLMModel
import os
import json
from typing import Callable
# from smolagents import tool

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# @tool
# def get_name_of_user() -> str:
#     """
#     Get the name of the user that you are conversing with.

#     No Args.
#     """
#     return "Sama"

model = LiteLLMModel(
    model_id="anthropic/claude-3-5-sonnet-latest",
    api_key=ANTHROPIC_API_KEY,
)


def text2regex(text: str) -> str:
    """
    I want you to act as a regex generator.
    Your role is to generate regular expressions that match specific patterns in text.
    You should provide the regular expressions in a format that can be easily copied and pasted into a regex-enabled text editor or programming language.
    Do not write explanations or examples of how the regular expressions work; simply provide a string response with the regex pattern.
    """
    agent = CodeAgent(tools=[], model=model, add_base_tools=False)
    return agent.run(f"""<request>{text}</request>
Generate a regex pattern based on the request.""")
    
    
def text2code(text: str) -> str:
    """
    I want you to act as a code generator.
    Your role is to generate code that can be easily copied and pasted into an IDE.
    You should provide the code in a format that can be easily copied and pasted into a programming language.
    Do not write explanations or examples of how the code works; simply provide a string response with the code.
    """
    agent = CodeAgent(tools=[], model=model, add_base_tools=False)
    return agent.run(f"""<request>{text}</request>
Generate code based on the request.""")


def process_dataset(
    input_file: str, output_file: str, process_function: Callable[[str], str]
) -> None:
    # Load existing progress if output file exists
    processed_ids = set()
    results = []
    if os.path.exists(output_file):
        with open(output_file, "r") as f:
            results = json.load(f)
            processed_ids = {item["id"] for item in results}

    # Process input file
    with open(input_file, "r") as f:
        data = json.load(f)

    # Process each unprocessed item
    for item in data:
        if item["id"] not in processed_ids:
            response = process_function(item["input"])
            result = {"id": item["id"], "output": response}
            results.append(result)
            processed_ids.add(item["id"])

            # Save progress after each item
            with open(output_file, "w") as f:
                json.dump(results, f, indent=2)

            print(f"Processed item {item['id']}: {response}")


if __name__ == "__main__":
    process_dataset("input.json", "output.json", text2code)


# response = text2regex("I want to find all the numbers in the text that are greater than 100.")
# print(f"Response: {response}")
