/**
 * Component: AdminGuideContent
 * Purpose: Display comprehensive admin guide for game package management
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Game package creation guide
 * - Game management instructions
 * - Training hints best practices
 * - Category management
 * - System prompts configuration
 * - Workflow examples and best practices
 *
 * @since 2025-11-20
 */

import React from 'react';

/**
 * AdminGuideContent component - Static admin guide content
 *
 * Displays comprehensive documentation for game package management.
 * Extracted from GamePackageManagement to reduce component size.
 *
 * @returns {JSX.Element} Admin guide content section
 *
 * @example
 * {activeTab === 'guide' && <AdminGuideContent />}
 */
function AdminGuideContent() {
  return (
    <div className="guide-section">
      <div className="guide-content">
        <h2>📖 Game Package Management - Admin Guide</h2>

        {/* Game Event Packages Section */}
        <section className="guide-section-item">
          <h3>📦 Game Event Packages</h3>
          <p>
            Game Event Packages are the central story containers for your Easter Quest.
            Each package represents a themed event (e.g., "Faust - The Quest for Knowledge 2024").
          </p>

          <h4>Creating a Game Event Package:</h4>
          <ol>
            <li>Click <strong>"➕ Create New Package"</strong> in the Packages tab</li>
            <li>Fill in the package details:
              <ul>
                <li><strong>Year:</strong> The year this event runs (e.g., 2024, 2025)</li>
                <li><strong>Title:</strong> The event name shown to players</li>
                <li><strong>Story HTML:</strong> The narrative introduction (supports HTML formatting)</li>
                <li><strong>Description:</strong> Short summary for admin reference</li>
                <li><strong>Author:</strong> Who created this event story</li>
                <li><strong>Active Status:</strong> Toggle to activate/deactivate the event</li>
              </ul>
            </li>
            <li>Click <strong>"✓ Save"</strong> to create the package</li>
          </ol>

          <h4>Adding an Event Image:</h4>
          <ol>
            <li>View or edit a Game Event Package</li>
            <li>Go to the <strong>📖 Event Story</strong> tab</li>
            <li>Click <strong>"Choose File"</strong> under "Event Image"</li>
            <li>Select an image (max 2MB, PNG/JPEG/GIF)</li>
            <li>Preview the image before saving</li>
            <li>
              In the Story HTML, use <code>{'<img src="{{EVENT_IMAGE}}" alt="Event Image" />'}</code> to place the image
            </li>
            <li>Click <strong>"✓ Save Changes"</strong></li>
          </ol>

          <p>
            <strong>💡 Tip:</strong> The <code>{'{{EVENT_IMAGE}}'}</code> placeholder allows you to
            position the image anywhere in your story HTML. You can add custom CSS classes for styling!
          </p>
        </section>

        {/* Games Section */}
        <section className="guide-section-item">
          <h3>🎮 Games</h3>
          <p>
            Games are the individual challenges within a Game Event Package. Each game belongs to a
            category (Puzzle, Riddle, Network, Server, Python, SQL).
          </p>

          <h4>Adding Games to a Package:</h4>
          <ol>
            <li>View a Game Event Package</li>
            <li>Go to the <strong>🎮 Games</strong> tab</li>
            <li>Click <strong>"➕ Add Game to Package"</strong></li>
            <li>Fill in the game details:
              <ul>
                <li><strong>Game Type:</strong> Select from database categories</li>
                <li><strong>Title:</strong> Shown to players after solving</li>
                <li><strong>Description:</strong> Full details shown after solving</li>
                <li><strong>Challenge Text:</strong> The riddle/question shown before solving (no spoilers!)</li>
                <li><strong>Difficulty:</strong> Easy, Medium, Hard, Expert</li>
                <li><strong>Points:</strong> Score value (10-100)</li>
                <li><strong>Order Index:</strong> Display order (1, 2, 3...)</li>
                <li><strong>Solution:</strong> Correct answer (case-insensitive)</li>
              </ul>
            </li>
            <li>Click <strong>"✓ Save"</strong></li>
          </ol>

          <h4>Game Card Display Logic:</h4>
          <ul>
            <li><strong>Before Solving:</strong> Shows category icon, challenge text, difficulty, and points</li>
            <li><strong>After Solving:</strong> Reveals title, full description, and completion status</li>
          </ul>
        </section>

        {/* Training Hints Section */}
        <section className="guide-section-item">
          <h3>💡 Training Hints</h3>
          <p>
            Training Hints provide AI assistant guidance for specific games. These hints are used by
            the AI to help players without giving away solutions.
          </p>

          <h4>Adding Training Hints:</h4>
          <ol>
            <li>View a Game Event Package</li>
            <li>Go to the <strong>💡 Training Hints</strong> tab</li>
            <li>Select a game from the dropdown</li>
            <li>Enter progressive hints (start vague, get more specific)</li>
            <li>Click <strong>"➕ Add Hint"</strong> for each hint level</li>
          </ol>

          <p><strong>Best Practices:</strong></p>
          <ul>
            <li>First hint: General direction or concept</li>
            <li>Second hint: Narrow down the approach</li>
            <li>Third hint: Point to specific technique (but not the answer!)</li>
          </ul>
        </section>

        {/* Categories Section */}
        <section className="guide-section-item">
          <h3>🏷️ Categories</h3>
          <p>
            Categories organize games by type. Each category has a color and emoji icon for visual identification.
          </p>

          <h4>Default Categories:</h4>
          <ul>
            <li>🧩 <strong>Puzzle:</strong> Logic puzzles and brain teasers</li>
            <li>❓ <strong>Riddle:</strong> Word riddles and lateral thinking</li>
            <li>🌐 <strong>Network:</strong> IT networking challenges</li>
            <li>🖥️ <strong>Server:</strong> Server administration tasks</li>
            <li>🐍 <strong>Python:</strong> Python programming challenges</li>
            <li>🗄️ <strong>SQL:</strong> Database query challenges</li>
          </ul>

          <h4>Managing Categories:</h4>
          <ol>
            <li>Go to the <strong>🏷️ Categories</strong> tab</li>
            <li>Click <strong>"➕ Create New Category"</strong> to add custom categories</li>
            <li>Edit or delete existing categories (cannot delete if games are using it)</li>
          </ol>
        </section>

        {/* System Prompts Section */}
        <section className="guide-section-item">
          <h3>🤖 System Prompts</h3>
          <p>
            System Prompts control the AI assistant's behavior, personality, and response style.
            Each event has its own set of prompts copied from default templates.
          </p>

          <h4>Prompt Categories (in order of priority):</h4>
          <ol>
            <li><strong>core_rules:</strong> Fundamental AI behavior rules</li>
            <li><strong>hint_strategy:</strong> How the AI should provide hints</li>
            <li><strong>game_story:</strong> Story context and narrative tone</li>
            <li><strong>company_context:</strong> Ypsomed-specific information</li>
            <li><strong>response_templates:</strong> Example responses and formats</li>
          </ol>

          <h4>Creating/Editing Prompts:</h4>
          <ol>
            <li>Open an event package</li>
            <li>Go to the <strong>🤖 System Prompts</strong> tab</li>
            <li>Click <strong>"➕ Create New System Prompt"</strong></li>
            <li>Fill in:
              <ul>
                <li><strong>Name:</strong> Short identifier</li>
                <li><strong>Category:</strong> Select from dropdown</li>
                <li><strong>Priority:</strong> Lower number = higher priority (1-100)</li>
                <li><strong>Content:</strong> The actual prompt text</li>
                <li><strong>Description:</strong> What this prompt does</li>
              </ul>
            </li>
            <li>Activate/deactivate prompts to test different behaviors</li>
          </ol>

          <p>
            <strong>⚠️ Important:</strong> Only active prompts are sent to the AI. Use priority to
            control which prompts take precedence when multiple prompts in the same category exist.
            Prompts are event-specific - each event can have customized AI behavior.
          </p>
        </section>

        {/* Workflow Example Section */}
        <section className="guide-section-item">
          <h3>🔄 Workflow Example</h3>
          <ol>
            <li><strong>Create Package:</strong> "Easter Quest 2025 - Mystery Theme"</li>
            <li><strong>Upload Image:</strong> Add a themed header image</li>
            <li><strong>Write Story:</strong> Create engaging narrative with <code>{'{{EVENT_IMAGE}}'}</code></li>
            <li><strong>Add Games:</strong> Create 10-15 challenges across different categories</li>
            <li><strong>Add Hints:</strong> Provide 2-3 progressive hints per game</li>
            <li><strong>Configure AI:</strong> Set system prompts for the event theme</li>
            <li><strong>Activate:</strong> Toggle "Active" status on the package</li>
            <li><strong>Test:</strong> Log in as a player and test the flow</li>
          </ol>
        </section>

        {/* Best Practices Section */}
        <section className="guide-section-item">
          <h3>📊 Best Practices</h3>
          <ul>
            <li><strong>Challenge Text:</strong> Keep it mysterious but fair - no red herrings</li>
            <li><strong>Difficulty Balance:</strong> Mix easy, medium, and hard games</li>
            <li><strong>Point Values:</strong> Harder games should offer more points</li>
            <li><strong>Hints:</strong> Never give away the solution directly</li>
            <li><strong>Images:</strong> Keep under 2MB for fast loading</li>
            <li><strong>Story HTML:</strong> Use semantic HTML for accessibility</li>
            <li><strong>Active Status:</strong> Only one event should be active at a time</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default AdminGuideContent;
