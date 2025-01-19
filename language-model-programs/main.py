from smolagents import CodeAgent, LiteLLMModel
import os
import json
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
    
# Open the input.json file
with open("input.json", "r") as file:
    data = json.load(file)
    for input in data:
        response = text2regex(input)
        print(f"Input: {input}, Response: {response}")


# response = text2regex("I want to find all the numbers in the text that are greater than 100.")
# print(f"Response: {response}")