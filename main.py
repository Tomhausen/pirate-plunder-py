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
tiles.set_current_tilemap(assets.tilemap("level"))
scene.camera_follow_sprite(ship)

def spawn_treasure(tile):
    treasure = sprites.create(assets.image("x"), SpriteKind.treasure)
    hitbox = sprites.create(image.create(47, 47), SpriteKind.hitbox)
    spriteutils.draw_circle(hitbox.image, 24, 24, 20, 1)
    hitbox.set_flag(SpriteFlag.INVISIBLE, True)
    tiles.place_on_tile(treasure, tile)
    tiles.place_on_tile(hitbox, tile)
    sprites.set_data_sprite(hitbox, "treasure", treasure)

def spawn_fort(tile):
    fort = sprites.create(assets.image("fort"), SpriteKind.enemy)
    tiles.place_on_tile(fort, tile)
    bar = statusbars.create(20, 4, StatusBarKind.enemy_health)
    bar.attach_to_sprite(fort)

def spawn_loop():
    if len(sprites.all_of_kind(SpriteKind.treasure)) < 10:
        tile = tilesAdvanced.get_all_wall_tiles()._pick_random()
        spawn_treasure(tile)
    if len(sprites.all_of_kind(SpriteKind.enemy)) < 10:
        tile = tilesAdvanced.get_all_wall_tiles()._pick_random()
        spawn_fort(tile)
game.on_update_interval(2000, spawn_loop)

def make_projectile(source: Sprite, kind):
    proj = sprites.create(assets.image("cannon ball"), kind)
    proj.set_position(source.x, source.y)
    proj.lifespan = 1500
    proj.set_flag(SpriteFlag.GHOST_THROUGH_WALLS, True)
    return proj

def player_fire():
    for rotation in range(0, 181, 180):
        proj = make_projectile(ship, SpriteKind.projectile)
        angle = transformSprites.get_rotation(ship) + rotation
        angle = spriteutils.degrees_to_radians(angle)
        spriteutils.set_velocity_at_angle(proj, angle, 100)
controller.A.on_event(ControllerButtonEvent.PRESSED, player_fire)

def enemy_fire(fort: Sprite):
    if randint(1, 100) == 1 and spriteutils.distance_between(fort, ship) < 80:
        proj = make_projectile(fort, SpriteKind.enemy_projectile)
        angle = spriteutils.angle_from(fort, ship)
        spriteutils.set_velocity_at_angle(proj, angle, 100)

def collect_treasure(ship, treasure_hitbox):
    info.change_score_by(randint(500, 2000))
    sprites.read_data_sprite(treasure_hitbox, "treasure").destroy()
    treasure_hitbox.destroy()
sprites.on_overlap(SpriteKind.player, SpriteKind.hitbox, collect_treasure)

def hit_fort(fort, cannon_ball):
    bar = statusbars.get_status_bar_attached_to(StatusBarKind.enemy_health, fort)
    bar.value -= 10
    cannon_ball.destroy()
    if bar.value < 1:
        spawn_treasure(fort.tilemap_location())
        fort.destroy()
sprites.on_overlap(SpriteKind.enemy, SpriteKind.projectile, hit_fort)

def player_hit(player, cannon_ball):
    info.change_life_by(-1)
    cannon_ball.destroy()
    pause(1000)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy_projectile, player_hit)

def fix_double_spawn(enemy, other_enemy):
    sprites.all_of_kind(SpriteKind.enemy).pop().destroy()
sprites.on_overlap(SpriteKind.enemy, SpriteKind.enemy, fix_double_spawn)

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
        enemy_fire(enemy)
game.on_update(tick)
