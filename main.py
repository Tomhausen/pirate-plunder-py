@namespace
class SpriteKind:
    treasure = SpriteKind.create()
    hitbox = SpriteKind.create()
    enemy_projectile = SpriteKind.create()
    port = SpriteKind.create()
    pool = SpriteKind.create() #

# variables
ship_acceleration = 1.5
turn_speed = 0.2
speed = 0
rotation = 0
treasure_onboard = 0
minimap_open = False #

# sprites
ship = sprites.create(assets.image("ship"), SpriteKind.player)
transformSprites.rotate_sprite(ship, 90)
whirlpool: Sprite = None

# setup
tiles.set_current_tilemap(assets.tilemap("level"))
scene.camera_follow_sprite(ship)

# text
treasure_text = textsprite.create(str(treasure_onboard), 3, 0)
treasure_text.z = 10
treasure_text.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)

# minimap
minimap_object = minimap.minimap(MinimapScale.EIGHTH, 2, 15) #
minimap_image = minimap.get_image(minimap_object) #
minimap_sprite = sprites.create(minimap_image) #
minimap_sprite.z = 10 #
minimap_sprite.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True) #
minimap_sprite.set_flag(SpriteFlag.INVISIBLE, True) #

def update_text():
    treasure_text.set_text(str(treasure_onboard))
    treasure_text.right = 160
    treasure_text.bottom = 120
update_text()

def make_ports():
    for i in range(3):
        port = sprites.create(assets.image("settlement"), SpriteKind.port)
        port_hitbox = sprites.create(image.create(47, 47), SpriteKind.port)
        spriteutils.draw_circle(port_hitbox.image, 24, 24, 20, 1)
        port_hitbox.set_flag(SpriteFlag.INVISIBLE, True)
        tile = tilesAdvanced.get_all_wall_tiles()._pick_random()
        tiles.place_on_tile(port, tile)
        tiles.place_on_tile(port_hitbox, tile)
        sprites.set_data_sprite(port_hitbox, "treasure", port)
        tiles.set_wall_at(tile, False)
make_ports()

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

def spawn_whirlpool():
    global whirlpool
    whirlpool = sprites.create(assets.image("whirlpool"), SpriteKind.pool)
    tiles.place_on_random_tile(whirlpool, assets.tile("water"))
    whirlpool.lifespan = 10000
    whirlpool.z = -1
game.on_update_interval(20000, spawn_whirlpool)

def make_projectile(source: Sprite, kind):
    proj = sprites.create(assets.image("cannon ball"), kind)
    proj.set_position(source.x, source.y)
    proj.lifespan = 1500
    proj.set_flag(SpriteFlag.GHOST_THROUGH_WALLS, True)
    return proj

def player_fire():
    for rotation in range(0, 181, 180):
        for aim in range(-15, 16, 15):
            proj = make_projectile(ship, SpriteKind.projectile)
            angle = transformSprites.get_rotation(ship) + rotation + aim
            angle = spriteutils.degrees_to_radians(angle)
            spriteutils.set_velocity_at_angle(proj, angle, 100)
controller.A.on_event(ControllerButtonEvent.PRESSED, player_fire)

def toggle_map(): #
    global minimap_open
    if minimap_open:
        minimap_sprite.set_flag(SpriteFlag.INVISIBLE, True)
        minimap_open = False
    else:
        minimap_sprite.set_flag(SpriteFlag.INVISIBLE, False)
        minimap_open = True
controller.B.on_event(ControllerButtonEvent.PRESSED, toggle_map)

def enemy_fire(fort: Sprite):
    if randint(1, 100) == 1 and spriteutils.distance_between(fort, ship) < 80:
        proj = make_projectile(fort, SpriteKind.enemy_projectile)
        angle = spriteutils.angle_from(fort, ship)
        spriteutils.set_velocity_at_angle(proj, angle, 100)

def collect_treasure(ship, treasure_hitbox):
    global treasure_onboard
    treasure_onboard += randint(500, 2000)
    update_text()
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

def sell_treasure(ship, port):
    global treasure_onboard
    info.change_score_by(treasure_onboard)
    treasure_onboard = 0
    update_text()
sprites.on_overlap(SpriteKind.player, SpriteKind.port, sell_treasure)

def player_hit(player, cannon_ball):
    info.change_life_by(-1)
    cannon_ball.destroy()
    pause(1000)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy_projectile, player_hit)

def fix_double_spawn(enemy, other_enemy):
    sprites.all_of_kind(SpriteKind.enemy).pop().destroy()
sprites.on_overlap(SpriteKind.enemy, SpriteKind.enemy, fix_double_spawn)

def update_minimap(): #
    if minimap_open:
        minimap_object = minimap.minimap(MinimapScale.EIGHTH, 2, 15)
        minimap.include_sprite(minimap_object, ship, MinimapSpriteScale.DOUBLE)
        for treasure in sprites.all_of_kind(SpriteKind.treasure):
            minimap.include_sprite(minimap_object, treasure, MinimapSpriteScale.DOUBLE)
        for fort in sprites.all_of_kind(SpriteKind.enemy):
            minimap.include_sprite(minimap_object, fort , MinimapSpriteScale.DOUBLE)
        for port in sprites.all_of_kind(SpriteKind.port):
            minimap.include_sprite(minimap_object, port, MinimapSpriteScale.DOUBLE)
        minimap_sprite.set_image(minimap.get_image(minimap_object))
game.on_update_interval(100, update_minimap)

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

def handle_whirlpool():
    if spriteutils.distance_between(ship, whirlpool) < 100:
        ship.vx += Math.sign(whirlpool.x - ship.x) * 15
        ship.vy += Math.sign(whirlpool.y - ship.y) * 15
    transformSprites.change_rotation(whirlpool, 1)

def tick():
    turn_ship()
    move()
    handle_whirlpool()
    for enemy in sprites.all_of_kind(SpriteKind.enemy):
        enemy_fire(enemy)
game.on_update(tick)
