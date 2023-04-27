import matplotlib.pyplot as plt

# Data from the provided stakes
stakes = [
    {
        'name': 'First Stake',
        'amount': 20,
        'user_stake_wei': 20_000_000_000_000_000_000,
        'block_passed': 18,
        'expected_cot_reward': 0.036,
        'expected_cot_reward_wei': 36_000_000_000_000_000,
        'start_block': 29_303_719,
        'end_block': 29_303_737
    },
    {
        'name': 'Second Stake',
        'amount': 30,
        'user_stake_wei': 50_000_000_000_000_000_000,
        'block_passed': 51,
        'expected_cot_reward': 0.255,
        'expected_cot_reward_wei': 255_000_000_000_000_000,
        'start_block': 29_303_737,
        'end_block': 29_303_788
    }
]

# Extract data for the chart
labels = [stake['name'] for stake in stakes]
rewards = [stake['expected_cot_reward'] for stake in stakes]

# Create a bar chart
plt.bar(labels, rewards)
plt.xlabel('Stakes')
plt.ylabel('Expected COT Rewards')
plt.title('Expected COT Rewards for Each Stake')

# Display the chart
plt.show()
