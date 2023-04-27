import random

def simulate_staking(days, num_users):
    simulation_data = {}
    random.seed(42)
    
    for user_index in range(1, num_users + 1):
        user = f"User {user_index}"
        rewards = [round(random.uniform(1, 100), 1) for _ in range(days)]
        total_reward = sum(rewards[:-1]) * 0.18
        simulation_data[user] = rewards + [total_reward]

        user_rewards = f"{user} rewards"
        rewards = [0] + [round(reward * 0.18, 1) for reward in rewards[1:-1]]
        simulation_data[user_rewards] = rewards + [total_reward]

    return simulation_data

def print_table(simulation_data):
    print(" " * 20 + "Day", end="")
    for day in range(0, 8):
        print(f"{day:>9}", end="")
    print("  Total Staked   Total Rewards")

    index = 0
    for user, data in simulation_data.items():
        print(f"{user:<20}", end="")
        for value in data[:-1]:
            print(f"{value:>9.1f}", end="")
        print(f"  {sum(data[:-1]):>12.1f}  {data[-1]:>14.1f}")
        index += 1
        if index % 2 == 0:
            print()

simulation = simulate_staking(8, 5)
print_table(simulation)

