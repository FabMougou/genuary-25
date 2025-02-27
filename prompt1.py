import cv2
import numpy as np
import random

# Window properties
WIDTH = 800
HEIGHT = 800  # Made square for easier recursion
WINDOW_NAME = "Recursive Moving Lines"

def create_moving_lines(depth, min_x, min_y, max_x, max_y):
    """
    Create moving lines for a specific depth level and region
    Returns positions and properties of horizontal and vertical lines
    """
    # For each depth level, we create 2 vertical and 2 horizontal lines
    
    # Calculate the width and height of the current region
    width = max_x - min_x
    height = max_y - min_y
    
    # Initial positions for lines (divide the region into 3 sections)
    third_w = width / 3
    third_h = height / 3
    
    # Ensure minimum separation
    min_sep = 20
    
    # Make sure initial positions have good separation
    v1 = min_x + third_w
    v2 = min_x + 2 * third_w
    if v2 - v1 < min_sep:
        v1 = min_x + (width / 2) - (min_sep / 2)
        v2 = v1 + min_sep
    
    vertical_x = np.array([v1, v2])
    
    h1 = min_y + third_h
    h2 = min_y + 2 * third_h
    if h2 - h1 < min_sep:
        h1 = min_y + (height / 2) - (min_sep / 2)
        h2 = h1 + min_sep
        
    horizontal_y = np.array([h1, h2])
    
    # Individual directions for each line
    vertical_directions = np.array([random.choice([-1, 1]) for _ in range(2)])
    horizontal_directions = np.array([random.choice([-1, 1]) for _ in range(2)])
    
    # Speed scales with the region size and depth
    # Adjusted to be slower for inner boxes
    speed_factor = 0.008 / (depth + 1)
    max_speed = min(width, height) * speed_factor
    min_speed = max_speed * 0.2
    
    vertical_speeds = np.array([random.uniform(min_speed, max_speed) for _ in range(2)])
    horizontal_speeds = np.array([random.uniform(min_speed, max_speed) for _ in range(2)])
    
    return {
        'vertical_x': vertical_x,
        'horizontal_y': horizontal_y,
        'vertical_directions': vertical_directions,
        'horizontal_directions': horizontal_directions,
        'vertical_speeds': vertical_speeds,
        'horizontal_speeds': horizontal_speeds,
        'min_x': min_x,
        'min_y': min_y, 
        'max_x': max_x,
        'max_y': max_y
    }

def main():
    # Create a black canvas
    canvas = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    
    # Maximum recursion depth
    max_depth = 5
    
    # List to hold line data for all depths
    all_levels = []
    
    # Initialize the first level (full window)
    all_levels.append(create_moving_lines(0, 0, 0, WIDTH, HEIGHT))
    
    # Create initial positions for deeper levels
    for depth in range(1, max_depth):
        # We'll recompute these each frame based on the parent level's lines
        parent = all_levels[depth - 1]
        p_vert_x = parent['vertical_x']
        p_horiz_y = parent['horizontal_y']
        
        # Create the inner box defined by the parent's lines
        # Ensure the inner box coordinates are sorted (smaller first)
        inner_min_x = min(p_vert_x[0], p_vert_x[1])
        inner_max_x = max(p_vert_x[0], p_vert_x[1])
        inner_min_y = min(p_horiz_y[0], p_horiz_y[1])
        inner_max_y = max(p_horiz_y[0], p_horiz_y[1])
        
        # Only create a new level if the box has enough space
        if inner_max_x - inner_min_x > 40 and inner_max_y - inner_min_y > 40:
            all_levels.append(create_moving_lines(
                depth, 
                inner_min_x, 
                inner_min_y, 
                inner_max_x, 
                inner_max_y
            ))
        else:
            # Break out if the box is too small
            break
    
    cv2.namedWindow(WINDOW_NAME)
    
    while True:
        # Create a fresh black canvas for each frame
        canvas.fill(0)
        
        valid_levels = len(all_levels)
        # Draw and update all levels, from outermost to innermost
        for depth in range(valid_levels):
            level = all_levels[depth]
            
            # Extract line data for this level
            vertical_x = level['vertical_x'].copy()
            horizontal_y = level['horizontal_y'].copy()
            vertical_directions = level['vertical_directions'].copy()
            horizontal_directions = level['horizontal_directions'].copy()
            vertical_speeds = level['vertical_speeds']
            horizontal_speeds = level['horizontal_speeds']
            min_x = level['min_x']
            min_y = level['min_y'] 
            max_x = level['max_x']
            max_y = level['max_y']
            
            # Ensure boundaries are valid (min < max)
            if max_x <= min_x + 20 or max_y <= min_y + 20:
                continue
                
            # Color fades with depth (brighter for inner boxes)
            color_intensity = 155 + (100 * depth / max_depth)
            v_color = (0, 0, min(255, color_intensity))
            h_color = (0, min(255, color_intensity), 0)
            
            # Draw vertical lines for this level
            for i, x in enumerate(vertical_x):
                cv2.line(canvas, (int(x), int(min_y)), (int(x), int(max_y)), v_color, 2)
            
            # Draw horizontal lines for this level
            for i, y in enumerate(horizontal_y):
                cv2.line(canvas, (int(min_x), int(y)), (int(max_x), int(y)), h_color, 2)
                
            # Update positions
            vertical_x = vertical_x + vertical_speeds * vertical_directions
            horizontal_y = horizontal_y + horizontal_speeds * horizontal_directions

            # Update the vertical lines section
            for i in range(len(vertical_x)):
                # Add a buffer to prevent lines from touching boundaries
                buffer = 5
                
                # Check if line hits boundaries - only bounce here
                if vertical_x[i] >= max_x - buffer:
                    vertical_x[i] = max_x - buffer
                    vertical_directions[i] = -1  # Change direction
                elif vertical_x[i] <= min_x + buffer:
                    vertical_x[i] = min_x + buffer
                    vertical_directions[i] = 1   # Change direction
                
                # Only enforce ordering if lines are moving in the same direction or
                # getting too close to each other
                min_separation = 10  # Increased minimum separation
                if i > 0:
                    # If lines are moving toward each other, let them pass
                    moving_toward_each_other = (vertical_directions[i-1] > 0 and vertical_directions[i] < 0)
                    
                    # If they're too close and not moving toward each other, enforce separation
                    if vertical_x[i] <= vertical_x[i-1] + min_separation and not moving_toward_each_other:
                        # Just reposition without changing direction
                        vertical_x[i] = vertical_x[i-1] + min_separation
                        
                    # Prevent crossing in non-passing scenario
                    if vertical_x[i] < vertical_x[i-1] and not moving_toward_each_other:
                        # Swap positions
                        vertical_x[i], vertical_x[i-1] = vertical_x[i-1] + min_separation, vertical_x[i] - min_separation
                        # No direction change needed as they're going in the same direction

            # Update the horizontal lines section
            for i in range(len(horizontal_y)):
                # Add a buffer to prevent lines from touching boundaries
                buffer = 5
                
                # Check if line hits boundaries - only bounce here
                if horizontal_y[i] >= max_y - buffer:
                    horizontal_y[i] = max_y - buffer
                    horizontal_directions[i] = -1  # Change direction
                elif horizontal_y[i] <= min_y + buffer:
                    horizontal_y[i] = min_y + buffer
                    horizontal_directions[i] = 1   # Change direction
                
                # Only enforce ordering if lines are moving in the same direction or
                # getting too close to each other
                min_separation = 10  # Increased minimum separation
                if i > 0:
                    # If lines are moving toward each other, let them pass
                    moving_toward_each_other = (horizontal_directions[i-1] > 0 and horizontal_directions[i] < 0)
                    
                    # If they're too close and not moving toward each other, enforce separation
                    if horizontal_y[i] <= horizontal_y[i-1] + min_separation and not moving_toward_each_other:
                        # Just reposition without changing direction
                        horizontal_y[i] = horizontal_y[i-1] + min_separation
                        
                    # Prevent crossing in non-passing scenario
                    if horizontal_y[i] < horizontal_y[i-1] and not moving_toward_each_other:
                        # Swap positions
                        horizontal_y[i], horizontal_y[i-1] = horizontal_y[i-1] + min_separation, horizontal_y[i] - min_separation
                        # No direction change needed as they're going in the same direction
            
            # Update the level data
            level['vertical_x'] = vertical_x
            level['horizontal_y'] = horizontal_y
            level['vertical_directions'] = vertical_directions
            level['horizontal_directions'] = horizontal_directions
            
            # Update the portion where we check for valid boundaries and update inner boxes

        # In the main loop, update this section:
        # Update deeper levels based on this level's new positions
        if depth < valid_levels - 1:
            next_level = all_levels[depth + 1]
            # Ensure the inner box coordinates are sorted and have minimum size
            next_min_x = min(vertical_x[0], vertical_x[1])
            next_max_x = max(vertical_x[0], vertical_x[1])
            next_min_y = min(horizontal_y[0], horizontal_y[1])
            next_max_y = max(horizontal_y[0], horizontal_y[1])
            
            # Enforce minimum box size to prevent disappearing boxes
            min_box_size = 30
            if next_max_x - next_min_x < min_box_size:
                center_x = (next_max_x + next_min_x) / 2
                next_min_x = center_x - min_box_size/2
                next_max_x = center_x + min_box_size/2
                
            if next_max_y - next_min_y < min_box_size:
                center_y = (next_max_y + next_min_y) / 2
                next_min_y = center_y - min_box_size/2
                next_max_y = center_y + min_box_size/2
            
            # Make sure box stays within parent bounds
            next_min_x = max(next_min_x, min_x + 5)
            next_max_x = min(next_max_x, max_x - 5)
            next_min_y = max(next_min_y, min_y + 5)
            next_max_y = min(next_max_y, max_y - 5)
            
            # Set next level boundaries
            next_level['min_x'] = next_min_x
            next_level['max_x'] = next_max_x
            next_level['min_y'] = next_min_y
            next_level['max_y'] = next_max_y
        
        # Show the canvas
        cv2.imshow(WINDOW_NAME, canvas)
        
        # Exit on ESC key
        key = cv2.waitKey(16) & 0xFF  # ~60 FPS
        if key == 27:  # ESC key
            break
    
    # Clean up
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()