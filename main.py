@namespace
class SpriteKind:
    treasure = SpriteKind.create()
    hitbox = SpriteKind.create()
    enemy_projectile = SpriteKind.create()

# variables
ship_acceleration = 1.5
turn_speed = 0.2
speed = 0
rotation = 0

# sprites 
ship = sprites.create(assets.image("ship"), SpriteKind.player)
transformSprites.rotate_sprite(ship, 90)

# setup
tiles.set_current_tilemap(assets.tilemap("test"))
scene.camera_follow_sprite(ship)

def spawn_treasure():
    if len(sprites.all_of_kind(SpriteKind.treasure)) < 10:
        treasure = sprites.create(assets.image("x"), SpriteKind.treasure)
        hitbox = sprites.create(image.create(47, 47), SpriteKind.hitbox)
        spriteutils.draw_circle(hitbox.image, 24, 24, 20, 1)
        hitbox.set_flag(SpriteFlag.INVISIBLE, True)
        tile = tilesAdvanced.get_all_wall_tiles()._pick_random()
        tiles.place_on_tile(treasure, tile)
        tiles.place_on_tile(hitbox, tile)
        sprites.set_data_sprite(hitbox, "treasure", treasure)
game.on_update_interval(2000, spawn_treasure)

def collect_treasure(ship, treasure_hitbox):
    info.change_score_by(randint(500, 2000))
    sprites.read_data_sprite(treasure_hitbox, "treasure").destroy()
    treasure_hitbox.destroy()
    spawn_treasure()
sprites.on_overlap(SpriteKind.player, SpriteKind.hitbox, collect_treasure)

def fire(source: Sprite, spritekind):
    for rotation in range(0, 181, 180):
        proj = sprites.create(assets.image("cannon ball"), spritekind)
        proj.set_position(source.x, source.y)
        proj.set_flag(SpriteFlag.DESTROY_ON_WALL, True)
        angle = transformSprites.get_rotation(source) + rotation
        angle = spriteutils.degrees_to_radians(angle)
        spriteutils.set_velocity_at_angle(proj, angle, 100)

def player_fire():
    fire(ship, SpriteKind.projectile)
controller.A.on_event(ControllerButtonEvent.PRESSED, player_fire)

def spawn_enemies():
    if len(sprites.all_of_kind(SpriteKind.enemy)) < 10:
        enemy = tilesAdvanced.create_pathfinder_sprite(assets.image("enemy"), SpriteKind.enemy)
        tilesAdvanced.place_on_random_tile_off_screen(enemy, assets.tile("water"))
        tilesAdvanced.follow_using_pathfinding(enemy, ship, 20)
# game.on_update_interval(2000, spawn_enemies)
spawn_enemies()

def enemy_behaviour(enemy: PathfindingSprite):
    angle_in_rads = spriteutils.angle_from(enemy, ship)
    angle_in_degrees = spriteutils.radians_to_degrees(angle_in_rads)
    if spriteutils.distance_between(enemy, ship) > 80:
        transformSprites.rotate_sprite(enemy, angle_in_degrees + 90)
    else:
        tilesAdvanced.stop_following_path(enemy)
        if transformSprites.get_rotation(enemy) - angle_in_degrees > 1:
            transformSprites.change_rotation(enemy, -0.5)
        if randint(1, 100) == 1:
            fire(enemy, SpriteKind.enemy_projectile)

def destroy_enemy(cannon_ball, enemy):
    cannon_ball.destroy()
    enemy.destroy()
sprites.on_overlap(SpriteKind.projectile, SpriteKind.enemy, destroy_enemy)

def hit():
    info.change_life_by(-1)
    pause(1000)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy_projectile, hit)

def turn_ship():
    global rotation
    if controller.left.is_pressed():
        rotation -= turn_speed
    elif controller.right.is_pressed():
        rotation += turn_speed
    rotation *= 0.7
    transformSprites.change_rotation(ship, rotation * speed / 10)

def move():
    global speed
    if controller.up.is_pressed():
        speed += ship_acceleration
    elif controller.down.is_pressed():
        speed -= ship_acceleration
    speed *= 0.98
    angle = spriteutils.degrees_to_radians(transformSprites.get_rotation(ship) - 90)
    spriteutils.set_velocity_at_angle(ship, angle, speed)

def tick():
    turn_ship()
    move()
    for enemy in sprites.all_of_kind(SpriteKind.enemy):
        enemy_behaviour(enemy)
    info.change_score_by(1)
game.on_update(tick)


# treasure map
# selling mechanic