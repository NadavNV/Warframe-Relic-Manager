import streamlit as st
import json
import uuid
from github import Github

# --- Configuration ---
LOCAL_ITEMS_PATH = "../../data/master_items.json"
LOCAL_RELICS_PATH = "../../data/relic_drops.json"
REPO_NAME = "NadavNV/Warframe-Relic-Manager"
# Max relics per row
MAX_COLS = 9


def update_local_files(relic_list, new_items):
    """Updates master_items and relic_drops with the new relic data."""
    # 1. Load data
    with open(LOCAL_ITEMS_PATH, 'r', encoding='utf-8') as f:
        master_data: dict = json.load(f)

    with open(LOCAL_RELICS_PATH, 'r', encoding='utf-8') as f:
        relic_drops_data = json.load(f)

    # 2. Process all relics in memory
    for relic_data in relic_list:
        # Update master_items structure
        # 1. Add relics to existing items
        all_rewards = relic_data['Common'] + relic_data['Uncommon'] + relic_data['Rare']
        for entry in all_rewards:
            item, part = entry['Item'], entry['Part']
            if item in master_data and part in master_data[item]:
                if relic_data['Name'] not in master_data[item][part]['relics']:
                    master_data[item][part]['relics'].append(relic_data['Name'])
        # 2. Add new items
        master_data.update(new_items)

        # Update relic_drops structure
        relic_drops_data[relic_data['Name']] = {
            "Common": [f"{i['Item']} {i['Part']}" for i in relic_data['Common']],
            "Uncommon": [f"{i['Item']} {i['Part']}" for i in relic_data['Uncommon']],
            "Rare": [f"{i['Item']} {i['Part']}" for i in relic_data['Rare']]
        }

    # 3. Write data
    with open(LOCAL_ITEMS_PATH, 'w', encoding='utf-8') as f:
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

    with open(LOCAL_ITEMS_PATH, 'r') as f:
        master_content = f.read()
    with open(LOCAL_RELICS_PATH, 'r') as f:
        relic_content = f.read()

    push_file("data/master_items.json", master_content, f"Patch {patch_num}: Update master_items")
    push_file("data/relic_drops.json", relic_content, f"Patch {patch_num}: Update relic_drops")

    return repo.create_pull(title=f"Patch {patch_num} Update", body="", head=branch_name, base="main").html_url


def add_items(rewards, relic_name, pending_items):
    for reward in rewards:
        item, part = reward['Item'], reward['Part']
        # Safety check
        if not item or not part:
            continue

        if item not in pending_items:
            pending_items[item] = {}

        if part not in pending_items[item]:
            pending_items[item][part] = {
                "count": 1,
                "relics": [relic_name]
            }
        else:
            if relic_name not in pending_items[item][part]['relics']:
                pending_items[item][part]['relics'].append(relic_name)


def remove_relic(relic_idx, pending_relics, pending_items):
    """Removes a relic by index and prunes empty parts/items from pending_items."""
    if relic_idx < 0 or relic_idx >= len(pending_relics):
        return

    relic_to_remove = pending_relics.pop(relic_idx)['Name']

    items_to_remove = []
    for item_name, item_parts in pending_items.items():
        parts_to_remove = []
        for part_name, part_data in item_parts.items():
            if relic_to_remove in part_data['relics']:
                part_data['relics'].remove(relic_to_remove)
            # If no relics left for this part, mark for removal
            if not part_data['relics']:
                parts_to_remove.append(part_name)

        # Cleanup empty parts
        for p in parts_to_remove:
            del pending_items[item_name][p]

        # If item has no parts left, mark item for removal
        if not pending_items[item_name]:
            items_to_remove.append(item_name)

    # Cleanup empty items
    for j in items_to_remove:
        del pending_items[j]


def main():
    st.set_page_config(page_title="Relic Manager", layout="wide")
    st.title("Warframe Relic Manager")

    if 'pending_relics' not in st.session_state:
        st.session_state.pending_relics = []
    if 'pending_items' not in st.session_state:
        st.session_state.pending_items = {}
    if 'form_key' not in st.session_state:
        st.session_state.form_key = 0
    pad_left, form, pad_right = st.columns(3)
    with form:
        # Patch Number Input
        patch_num = st.text_input("Patch Number", placeholder="e.g., 39.0.5")

        col_a, col_b, col_c = st.columns(3)
        with col_a:
            era = st.selectbox("Era", ["Axi", "Lith", "Meso", "Neo", "Vanguard"])
        with col_b:
            letter = st.text_input("Letter", key=f"relic_letter_{st.session_state.form_key}")
        with col_c:
            number = st.text_input("Relic Number", key=f"relic_number_{st.session_state.form_key}")

        st.subheader("Common")
        common_rewards = []
        for j in range(1, 4):
            c1, c2 = st.columns(2)
            with c1:
                i = st.text_input(f"{j}. Item", key=f"c_item_{j}_{st.session_state.form_key}")
            with c2:
                p = st.text_input(f"Part", key=f"c_part_{j}_{st.session_state.form_key}")
            common_rewards.append({"Item": i, "Part": p})

        st.subheader("Uncommon")
        uncommon_rewards = []
        for j in range(4, 6):
            c1, c2 = st.columns(2)
            with c1:
                i = st.text_input(f"{j}. Item", key=f"u_item_{j}_{st.session_state.form_key}")
            with c2:
                p = st.text_input(f"Part", key=f"u_part_{j}_{st.session_state.form_key}")
            uncommon_rewards.append({"Item": i, "Part": p})

        st.subheader("Rare")
        c1, c2 = st.columns(2)
        with c1:
            rare_i = st.text_input("6. Item", key=f"r_item_{st.session_state.form_key}")
        with c2:
            rare_p = st.text_input("Part", key=f"r_part_{st.session_state.form_key}")

        if st.button("Add Relic to Pending"):
            if letter and number:
                relic_name = f"{era} {letter.upper()}{number}"
                st.session_state.pending_relics.append({
                    "Name": relic_name,
                    "Common": [c for c in common_rewards if c['Item']],
                    "Uncommon": [u for u in uncommon_rewards if u['Item']],
                    "Rare": [{"Item": rare_i, "Part": rare_p}]
                })
                add_items(common_rewards + uncommon_rewards + [{"Item": rare_i, "Part": rare_p}], relic_name,
                          st.session_state.pending_items)

                st.session_state.form_key += 1
                st.rerun()
            else:
                st.toast("Letter and number are required")

    st.divider()

    # Optional debug view
    if st.session_state.pending_items:
        with st.expander("View Pending Items JSON"):
            st.json(st.session_state.pending_items)

    st.header("Pending Items")

    if st.session_state.pending_items:
        for idx_start in range(0, len(st.session_state.pending_items.keys()), MAX_COLS):
            item_keys = list(st.session_state.pending_items.keys())[idx_start: idx_start + MAX_COLS]
            row_items = [{key: st.session_state.pending_items[key]} for key in item_keys]

            # --- Centering Math ---
            empty_slots = MAX_COLS - len(row_items)
            left_spacer = empty_slots / 2
            right_spacer = empty_slots / 2

            weights = []
            if left_spacer > 0:
                weights.append(left_spacer)
            weights.extend([1] * len(row_items))  # Give each item card a weight of 1
            if right_spacer > 0:
                weights.append(right_spacer)

            cols = st.columns(weights)
            col_offset = 1 if left_spacer > 0 else 0

            # Draw each item card in its column
            for local_idx, item in enumerate(row_items):

                with cols[col_offset + local_idx]:
                    # Using a container with a border makes side-by-side UI much cleaner
                    with st.container(border=True):
                        item_name = list(item.keys())[0]
                        st.subheader(f"{item_name}")

                        parts_dict = st.session_state.pending_items[item_name]

                        # 1. Build list of dicts for the data editor
                        table_data = []
                        for part_name, part_data in parts_dict.items():
                            table_data.append({
                                "Component": part_name,
                                "Count": part_data.get("count", 1)
                            })

                        # 2. Display an editable table so users can set counts
                        # Using item_name for the key prevents data loss if items shift order
                        edited_data = st.data_editor(
                            table_data,
                            column_config={
                                "Component": st.column_config.TextColumn("Component", disabled=True),
                                "Count": st.column_config.NumberColumn("Count", min_value=1, step=1, required=True),
                            },
                            hide_index=True,
                            key=f"editor_{item_name}",
                            width="stretch"
                        )

                        # 3. Sync any count updates back to session_state
                        needs_rerun = False
                        for row in edited_data:
                            if isinstance(row, dict):
                                p_name = row["Component"]
                                p_count = row["Count"]
                                if p_name in parts_dict and parts_dict[p_name].get("count", 1) != p_count:
                                    st.session_state.pending_items[item_name][p_name]["count"] = p_count
                                    needs_rerun = True

                        # Force a rerun to sync the widget state with the newly updated dictionary
                        if needs_rerun:
                            st.rerun()

                        # 4. Form to manually add special requirements
                        with st.expander("➕ Add Component"):
                            c1, c2 = st.columns([3, 1.5])
                            with c1:
                                special_comp = st.text_input("Component Name", placeholder="e.g., Lex Prime",
                                                             key=f"sp_name_{item_name}", label_visibility="collapsed")
                            with c2:
                                special_count = st.number_input("Count", min_value=1, value=1, step=1,
                                                                key=f"sp_count_{item_name}",
                                                                label_visibility="collapsed")

                            if st.button("Add Component", key=f"sp_add_{item_name}", width="stretch"):
                                if special_comp and special_comp not in parts_dict:
                                    st.session_state.pending_items[item_name][special_comp] = {
                                        "count": special_count,
                                        "relics": ["Required Item"]
                                    }
                                    st.rerun()

    st.header("Pending Relics")

    if st.session_state.pending_relics:
        # Iterate over relics in chunks to create rows
        for idx_start in range(0, len(st.session_state.pending_relics), MAX_COLS):
            row_relics = st.session_state.pending_relics[idx_start: idx_start + MAX_COLS]

            # --- Centering Math ---
            empty_slots = MAX_COLS - len(row_relics)
            left_spacer = empty_slots / 2
            right_spacer = empty_slots / 2

            weights = []
            if left_spacer > 0:
                weights.append(left_spacer)
            weights.extend([1] * len(row_relics))  # Give each relic card a weight of 1
            if right_spacer > 0:
                weights.append(right_spacer)

            cols = st.columns(weights)
            col_offset = 1 if left_spacer > 0 else 0

            # Draw each relic card in its column
            for local_idx, relic in enumerate(row_relics):
                global_idx = idx_start + local_idx

                with cols[col_offset + local_idx]:
                    # Using a container with a border makes side-by-side UI much cleaner
                    with st.container(border=True):
                        st.subheader(f"{relic['Name']}")

                        padded_list = list(relic['Common'])
                        while len(padded_list) < 3:
                            padded_list.append({"Item": "", "Part": ""})
                        for item in padded_list:
                            st.markdown(f'<span style="color:#CD7F32">● {item["Item"]} {item["Part"]}</span>',
                                        unsafe_allow_html=True)

                        padded_list = list(relic['Uncommon'])
                        while len(padded_list) < 2:
                            padded_list.append({"Item": "", "Part": ""})
                        for item in padded_list:
                            st.markdown(f'<span style="color:#808080">● {item["Item"]} {item["Part"]}</span>',
                                        unsafe_allow_html=True)

                        for item in relic['Rare']:
                            st.markdown(f'<span style="color:#FFD700">★ {item["Item"]} {item["Part"]}</span>',
                                        unsafe_allow_html=True)

                        # Set width='stretch' so the button fits the card nicely
                        if st.button(f"Remove {relic['Name']}", key=f"del_{global_idx}", width='stretch'):
                            remove_relic(global_idx, st.session_state.pending_relics, st.session_state.pending_items)
                            st.rerun()

    else:
        st.info("No relics added yet. Use the form above to build a list before submitting.")

    if st.session_state.pending_relics:
        # The button is always visible as long as you have relics
        if st.button("Update Local & Create PR"):
            if not patch_num:
                # Throw a loud error if they forgot the patch number
                st.error("⚠️ Please enter a Patch Number at the top of the app before submitting!")
            else:
                update_local_files(st.session_state.pending_relics, st.session_state.pending_items)
                pr_url = create_pull_request(patch_num)
                st.success(f"Success! [View PR]({pr_url})")
                st.session_state.pending_relics = []
                st.session_state.pending_items = {}


if __name__ == "__main__":
    main()
