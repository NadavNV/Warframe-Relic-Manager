import streamlit as st
import json
import uuid
from github import Github

# --- Configuration ---
LOCAL_MASTER_PATH = "../../data/master_items.json"
LOCAL_RELICS_PATH = "../../data/relic_drops.json"
REPO_NAME = "NadavNV/Warframe-Relic-Manager"


def update_local_files(relic_list):
    """Updates master_items and relic_drops with the new relic data."""
    # 1. Load data
    with open(LOCAL_MASTER_PATH, 'r', encoding='utf-8') as f:
        master_data = json.load(f)

    with open(LOCAL_RELICS_PATH, 'r', encoding='utf-8') as f:
        relic_drops_data = json.load(f)

    # 2. Process all relics in memory
    for relic_data in relic_list:
        # Update master_items structure
        all_rewards = relic_data['Common'] + relic_data['Uncommon'] + relic_data['Rare']
        for entry in all_rewards:
            family, part = entry['Family'], entry['Part']
            if family in master_data and part in master_data[family]:
                if relic_data['Name'] not in master_data[family][part]['relics']:
                    master_data[family][part]['relics'].append(relic_data['Name'])

        # Update relic_drops structure
        relic_drops_data[relic_data['Name']] = {
            "Common": [f"{i['Family']} {i['Part']}" for i in relic_data['Common']],
            "Uncommon": [f"{i['Family']} {i['Part']}" for i in relic_data['Uncommon']],
            "Rare": [f"{i['Family']} {i['Part']}" for i in relic_data['Rare']]
        }

    # 3. Write data
    with open(LOCAL_MASTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(master_data, f, indent=4)

    with open(LOCAL_RELICS_PATH, 'w', encoding='utf-8') as f:
        json.dump(relic_drops_data, f, indent=4)


def create_pull_request(patch_num):
    """Pushes local changes to a new GitHub branch and opens a PR."""
    g = Github(st.secrets["github_token"])
    repo = g.get_repo(REPO_NAME)
    branch_name = f"patch-{patch_num}-{uuid.uuid4().hex[:6]}"

    # Create branch
    main_ref = repo.get_git_ref("heads/main")
    repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=main_ref.object.sha)

    # Helper to update file
    def push_file(path, content, message):
        file_info = repo.get_contents(path, ref=branch_name)
        repo.update_file(file_info.path, message, content, file_info.sha, branch=branch_name)

    with open(LOCAL_MASTER_PATH, 'r') as f:
        master_content = f.read()
    with open(LOCAL_RELICS_PATH, 'r') as f:
        relic_content = f.read()

    push_file("data/master_items.json", master_content, f"Patch {patch_num}: Update master_items")
    push_file("data/relic_drops.json", relic_content, f"Patch {patch_num}: Update relic_drops")

    return repo.create_pull(title=f"Patch {patch_num} Update", body="", head=branch_name, base="main").html_url


def main():
    st.title("Warframe Relic Manager")

    if 'pending_relics' not in st.session_state:
        st.session_state.pending_relics = []

    # Patch Number Input
    patch_num = st.text_input("Patch Number", placeholder="e.g., 39.0.5")

    col_a, col_b, col_c = st.columns(3)
    with col_a:
        era = st.selectbox("Era", ["Axi", "Lith", "Meso", "Neo"])
    with col_b:
        letter = st.text_input("Letter")
    with col_c:
        number = st.text_input("Relic Number")

    st.subheader("Common")
    common_rewards = []
    for i in range(1, 4):
        c1, c2 = st.columns(2)
        with c1:
            f = st.text_input(f"{i}. Item", key=f"c_fam_{i}")
        with c2:
            p = st.text_input(f"Part", key=f"c_part_{i}")
        common_rewards.append({"Family": f, "Part": p})

    st.subheader("Uncommon")
    uncommon_rewards = []
    for i in range(4, 6):
        c1, c2 = st.columns(2)
        with c1:
            f = st.text_input(f"{i}. Item", key=f"u_fam_{i}")
        with c2:
            p = st.text_input(f"Part", key=f"u_part_{i}")
        uncommon_rewards.append({"Family": f, "Part": p})

    st.subheader("Rare")
    c1, c2 = st.columns(2)
    with c1:
        rare_f = st.text_input("6. Item", key="r_fam")
    with c2:
        rare_p = st.text_input("Part", key="r_part")

    if st.button("Add Relic to Pending"):
        if rare_f and number:
            st.session_state.pending_relics.append({
                "Name": f"{era} {letter.upper()}{number}",
                "Common": [c for c in common_rewards if c['Family']],
                "Uncommon": [u for u in uncommon_rewards if u['Family']],
                "Rare": [{"Family": rare_f, "Part": rare_p}]
            })
            st.rerun()

    st.divider()
    st.header("Pending Relics")
    if st.session_state.pending_relics:
        for idx, relic in enumerate(st.session_state.pending_relics):
            st.subheader(f"{relic['Name']}")
            for item in relic['Common']:
                st.markdown(f'<span style="color:#CD7F32">● {item["Family"]} {item["Part"]}</span>',
                            unsafe_allow_html=True)
            for item in relic['Uncommon']:
                st.markdown(f'<span style="color:#808080">● {item["Family"]} {item["Part"]}</span>',
                            unsafe_allow_html=True)
            for item in relic['Rare']:
                st.markdown(f'<span style="color:#FFD700">★ {item["Family"]} {item["Part"]}</span>',
                            unsafe_allow_html=True)

            if st.button(f"Remove {relic['Name']}", key=f"del_{idx}"):
                st.session_state.pending_relics.pop(idx)
                st.rerun()
    else:
        st.info("No relics added yet. Use the form above to build a list before submitting.")

    if st.session_state.pending_relics and patch_num:
        if st.button("Update Local & Create PR"):
            update_local_files(st.session_state.pending_relics)
            pr_url = create_pull_request(patch_num)
            st.success(f"Success! [View PR]({pr_url})")
            st.session_state.pending_relics = []


if __name__ == "__main__":
    main()
