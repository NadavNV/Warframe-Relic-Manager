import unittest
from unittest.mock import patch, mock_open
import json
from packages.data_scripts.relic_adder import add_items, update_local_files, remove_relic


class TestRelicAdder(unittest.TestCase):

    def setUp(self):
        """Provides a fresh dictionary for each test case."""
        self.empty_pending_items = {}

    # --- ADD_ITEMS TESTS ---

    def test_add_items_initializes_new_item_and_part(self):
        """Verifies that a brand new item-part hierarchy is cleanly created."""
        rewards = [{"Item": "Volt Prime", "Part": "Chassis"}]

        add_items("Common", rewards, "Lith L1", self.empty_pending_items)

        self.assertIn("Volt Prime", self.empty_pending_items)
        self.assertIn("Chassis", self.empty_pending_items["Volt Prime"])

        part_data = self.empty_pending_items["Volt Prime"]["Chassis"]
        self.assertEqual(part_data["rarity"], "Common")
        self.assertEqual(part_data["count"], 1)
        self.assertEqual(part_data["relics"], ["Lith L1"])

    def test_add_items_appends_to_existing_item_different_part(self):
        """Verifies that adding a new part to an existing item does not overwrite existing parts."""
        self.empty_pending_items["Volt Prime"] = {
            "Chassis": {"rarity": "Common", "count": 1, "relics": ["Lith L1"]}
        }

        rewards = [{"Item": "Volt Prime", "Part": "Systems"}]
        add_items("Uncommon", rewards, "Lith L2", self.empty_pending_items)

        self.assertIn("Chassis", self.empty_pending_items["Volt Prime"])
        self.assertIn("Systems", self.empty_pending_items["Volt Prime"])
        self.assertEqual(self.empty_pending_items["Volt Prime"]["Systems"]["rarity"], "Uncommon")

    def test_add_items_appends_new_relic_to_existing_part(self):
        """Verifies that adding the same item part from a different relic grows the relics list."""
        self.empty_pending_items["Volt Prime"] = {
            "Chassis": {"rarity": "Common", "count": 1, "relics": ["Lith L1"]}
        }

        rewards = [{"Item": "Volt Prime", "Part": "Chassis"}]
        add_items("Common", rewards, "Lith L2", self.empty_pending_items)

        relics_list = self.empty_pending_items["Volt Prime"]["Chassis"]["relics"]
        self.assertEqual(len(relics_list), 2)
        self.assertIn("Lith L1", relics_list)
        self.assertIn("Lith L2", relics_list)

    def test_add_items_ignores_duplicates(self):
        """Verifies that the same relic isn't appended to the same part multiple times."""
        self.empty_pending_items["Volt Prime"] = {
            "Chassis": {"rarity": "Common", "count": 1, "relics": ["Lith L1"]}
        }

        rewards = [{"Item": "Volt Prime", "Part": "Chassis"}]
        add_items("Common", rewards, "Lith L1", self.empty_pending_items)

        relics_list = self.empty_pending_items["Volt Prime"]["Chassis"]["relics"]
        self.assertEqual(len(relics_list), 1)

    # --- REMOVE RELIC INTEGRITY TESTS ---

    def test_remove_relic_pruning_logic(self):
        """Tests that removing a relic properly prunes empty parts and weapons from pending_items."""
        # 1. Setup simulated production state
        pending_relics = [
            {"Name": "Lith L1", "Common": [], "Uncommon": [], "Rare": []},
            {"Name": "Lith L2", "Common": [], "Uncommon": [], "Rare": []}
        ]

        pending_items = {
            "Volt Prime": {
                "Chassis": {"rarity": "Common", "count": 1, "relics": ["Lith L1"]},
                "Systems": {"rarity": "Uncommon", "count": 1, "relics": ["Lith L1", "Lith L2"]}
            },
            "Lex Prime": {
                "Receiver": {"rarity": "Rare", "count": 1, "relics": ["Lith L1"]}
            }
        }

        # 2. Call the actual production function (removing index 0 -> "Lith L1")
        remove_relic(0, pending_relics, pending_items)

        # 3. ASSERTIONS:
        # Ensure the relic was removed from the list
        self.assertEqual(len(pending_relics), 1)
        self.assertEqual(pending_relics[0]["Name"], "Lith L2")

        # Volt Prime Chassis had ONLY Lith L1, so Chassis must be deleted
        self.assertNotIn("Chassis", pending_items["Volt Prime"])

        # Volt Prime Systems had BOTH Lith L1 and Lith L2, so Systems must survive with Lith L2
        self.assertIn("Systems", pending_items["Volt Prime"])
        self.assertEqual(pending_items["Volt Prime"]["Systems"]["relics"], ["Lith L2"])

        # Lex Prime only had Lith L1, so the entire Lex Prime weapon entry must be deleted
        self.assertNotIn("Lex Prime", pending_items)

    # --- DATA IO UNIT TESTS ---

    @patch("builtins.open", new_callable=mock_open, read_data='{}')
    def test_update_local_files_writes_successfully(self, mock_file):
        """Tests that update_local_files reads, merges, and writes output without changing production data."""

        mock_master_data = json.dumps({
            "Volt Prime": {
                "Chassis": {"rarity": "Common", "count": 1, "relics": []}
            }
        })
        mock_relic_drops = json.dumps({})

        def side_effect(path, *args, **kwargs):
            if "master_items.json" in path:
                return mock_open(read_data=mock_master_data).return_value
            return mock_open(read_data=mock_relic_drops).return_value

        with patch("builtins.open", side_effect):
            relic_list = [{
                "Name": "Lith V1",
                "Common": [{"Item": "Volt Prime", "Part": "Chassis"}],
                "Uncommon": [],
                "Rare": []
            }]
            new_items = {}

            # This will execute without touching your local disk
            update_local_files(relic_list, new_items)
